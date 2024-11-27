import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import { Handle, Position, NodeProps, NodeResizeControl, useReactFlow } from '@xyflow/react';
import { useAppStore } from '@/lib/store';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import BulletList from '@tiptap/extension-bullet-list';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import TiptapImage from '@tiptap/extension-image';
import Dropcursor from '@tiptap/extension-dropcursor';
import { exportToMarkdown } from '@/lib/exportUtils';
import { Progman43 } from '@react95/icons';
import 'katex/dist/katex.min.css';
import { LatexNode } from './LatexNode';
import { WindowData, DragStartPos } from './types';
import {
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  WINDOW_PADDING,
  RESIZE_CONTROL_SIZE,
  ZOOM_ANIMATION_DURATION,
  MAX_ZOOM_LEVEL,
  AUTOSAVE_DELAY,
  DRAG_THRESHOLD,
  IMAGE_PADDING
} from './constants';
import {
  sanitizeHtml,
  validateImage,
  debounce,
  hasContentChanged,
  saveToLocalStorage,
  reportError,
  RateLimit,
  processImage,
  isValidUrl
} from './utils';

const lowlight = createLowlight(all);

// Rate limiter for autosave
const saveRateLimit = new RateLimit(60 * 1000, 500);

const TextWindow: React.FC<NodeProps & { data: WindowData }> = memo(({ id, data, selected }) => {
  const { updateWindow, removeWindow } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragStartPosRef = useRef<DragStartPos | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const previousContentRef = useRef<string>(data.content || '');
  const { setViewport } = useReactFlow();
  const draggedImageRef = useRef<string | null>(null);

  // Debounced autosave
  const debouncedSave = useCallback(
    debounce<(content: string) => void>((content: string) => {
      if (saveRateLimit.canProceed() && hasContentChanged(previousContentRef.current, content)) {
        try {
          updateWindow(id, { content: sanitizeHtml(content) });
          saveToLocalStorage(`backup_${id}`, content);
          previousContentRef.current = content;
        } catch (error) {
          reportError(error as Error, { windowId: id });
        }
      }
    }, AUTOSAVE_DELAY),
    [id, updateWindow]
  );

  // Editor Configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        languageClassPrefix: 'language-',
        HTMLAttributes: {
          class: 'code-block',
          spellcheck: 'false',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'custom-bullet-list',
        },
        keepMarks: true,
        keepAttributes: true,
        itemTypeName: 'listItem',
      }),
      HorizontalRule,
      Markdown,
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
        validate: url => isValidUrl(url),
      }),
      Placeholder.configure({
        placeholder: data.isReadOnly ? '' : 'Type here to start...',
      }),
      TiptapImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'resizable-image',
          draggable: 'true',
          style: 'cursor: move',
        },
      }),
      Dropcursor.configure({
        class: 'drop-cursor',
      }),
      LatexNode,
    ],
    content: sanitizeHtml(data.content || ''),
    editable: !data.isReadOnly,
    onCreate: ({ editor }) => {
      if (data.isNew && !data.isReadOnly) {
        setTimeout(() => editor.commands.focus('end'), 100);
      }
    },
    onFocus: () => setIsEditing(true),
    onBlur: () => setIsEditing(false),
    onUpdate: ({ editor }) => {
      if (!data.isReadOnly) {
        debouncedSave(editor.getHTML());
      }
    },
  });

  // Window zooming functionality
  const zoomToWindow = useCallback(() => {
    const node = document.getElementById(id);
    if (node) {
      const bounds = node.getBoundingClientRect();
      const targetZoom = Math.min(
        (window.innerWidth - WINDOW_PADDING * 2) / bounds.width,
        (window.innerHeight - WINDOW_PADDING * 2) / bounds.height,
        MAX_ZOOM_LEVEL
      );

      const x = -(bounds.left + bounds.width / 2 - window.innerWidth / 2) / targetZoom;
      const y = -(bounds.top + bounds.height / 2 - window.innerHeight / 2) / targetZoom;

      setViewport({ x, y, zoom: targetZoom }, { duration: ZOOM_ANIMATION_DURATION });
    }
  }, [id, setViewport]);

  // Image handling functions
  const handleImageProcess = useCallback(async (imgSrc: string, file?: File) => {
    try {
      if (file) {
        await validateImage(file);
      }

      const windowWidth = data.size?.width ?? DEFAULT_WINDOW_WIDTH;
      const maxWidth = windowWidth - IMAGE_PADDING;
      const dimensions = await processImage(imgSrc, maxWidth);

      if (editor) {
        editor.chain()
          .focus()
          .setImage({
            src: imgSrc,
            alt: file?.name || 'Dragged image',
            ...dimensions
          })
          .insertContent('<p></p>')
          .focus()
          .run();
      }
    } catch (error) {
      reportError(error as Error, { windowId: id });
    }
  }, [editor, data.size?.width, id]);

  // Event handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files)
        .filter(file => file.type.startsWith('image/'))
        .forEach(file => {
          const reader = new FileReader();
          reader.onload = event => {
            if (event.target?.result) {
              handleImageProcess(event.target.result.toString(), file);
            }
          };
          reader.readAsDataURL(file);
        });
    } else if (draggedImageRef.current) {
      handleImageProcess(draggedImageRef.current);
      draggedImageRef.current = null;
    }
  }, [handleImageProcess]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const isZooming = e.ctrlKey || e.metaKey;
    if (isZooming) return;
    
    if (editorRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = editorRef.current;
      const isAtTop = scrollTop === 0 && e.deltaY < 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;
      
      if (!isAtTop && !isAtBottom) {
        e.stopPropagation();
      }
    }
  }, []);

  const handleWindowMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2 || !editorRef.current?.contains(e.target as Node)) {
      e.stopPropagation();
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      setIsDragging(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && dragStartPosRef.current) {
      const deltaX = Math.abs(e.clientX - dragStartPosRef.current.x);
      const deltaY = Math.abs(e.clientY - dragStartPosRef.current.y);
      
      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        setIsDragging(true);
      }
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    dragStartPosRef.current = null;
    setIsDragging(false);
  }, []);

  const getCursorStyle = useCallback(() => {
    if (isDragging) return 'move';
    if (isEditing) return 'text';
    return data.isReadOnly ? 'default' : 'text';
  }, [isDragging, isEditing, data.isReadOnly]);

  const handleExport = useCallback(async () => {
    if (editor) {
      try {
        const content = editor.getHTML();
        await exportToMarkdown(data.title, sanitizeHtml(content));
      } catch (error) {
        reportError(error as Error, { 
          windowId: id,
          action: 'export',
          title: data.title
        });
      }
    }
  }, [editor, data.title, id]);

  // Effects
  useEffect(() => {
    if (data.isNew) {
      zoomToWindow();
      setTimeout(() => updateWindow(id, { isNew: false }), 100);
    }
  }, [data.isNew, zoomToWindow, id, updateWindow]);

  useEffect(() => {
    if (selected && editor && !isDragging) {
      editor.commands.focus('end');
    }
  }, [selected, editor, isDragging]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        dragStartPosRef.current = null;
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (editor) {
        const content = editor.getHTML();
        saveToLocalStorage(`backup_${id}`, content);
      }
    };
  }, [editor, id]);

  return (
    <div 
      ref={windowRef}
      className="window"
      style={{
        width: data.size?.width ?? DEFAULT_WINDOW_WIDTH,
        height: data.size?.height ?? DEFAULT_WINDOW_HEIGHT,
        backgroundColor: 'white',
        border: '2px solid #000080',
        position: 'relative',
        zIndex: data.zIndex ?? 1,
        outline: selected ? '2px solid #000080' : 'none',
        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)',
        cursor: getCursorStyle(),
      }}
      onMouseDown={handleWindowMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {!data.isReadOnly && (
        <>
          <NodeResizeControl 
            position="top-left" 
            style={{ width: RESIZE_CONTROL_SIZE, height: RESIZE_CONTROL_SIZE, cursor: 'nw-resize', border: 'none', background: 'transparent' }} 
            onResize={(_, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <NodeResizeControl 
            position="top-right" 
            style={{ width: RESIZE_CONTROL_SIZE, height: RESIZE_CONTROL_SIZE, cursor: 'ne-resize', border: 'none', background: 'transparent' }} 
            onResize={(_, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <NodeResizeControl 
            position="bottom-left" 
            style={{ width: RESIZE_CONTROL_SIZE, height: RESIZE_CONTROL_SIZE, cursor: 'sw-resize', border: 'none', background: 'transparent' }} 
            onResize={(_, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <NodeResizeControl 
            position="bottom-right" 
            style={{ width: RESIZE_CONTROL_SIZE, height: RESIZE_CONTROL_SIZE, cursor: 'se-resize', border: 'none', background: 'transparent' }} 
            onResize={(_, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          {['top', 'bottom', 'left', 'right'].map((pos) => (
            <React.Fragment key={pos}>
              <Handle 
                type="target" 
                position={pos as Position} 
                id={`${pos}-target`}
                style={{ visibility: selected ? 'visible' : 'hidden' }} 
              />
              <Handle 
                type="source" 
                position={pos as Position} 
                id={`${pos}-source`}
                style={{ visibility: selected ? 'visible' : 'hidden' }} 
              />
            </React.Fragment>
          ))}
        </>
      )}
      
      <div className="title-bar">
        <div className="title-bar-text">{data.title}</div>
        <div className="title-bar-controls">
          <button 
            aria-label="Export" 
            onClick={handleExport} 
            style={{ 
              marginRight: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px'
            }}
          >
            <Progman43 
              style={{ 
                width: '11px', 
                height: '11px'
              }} 
            />
          </button>
          <button aria-label="Minimize" />
          <button aria-label="Maximize" />
          <button aria-label="Close" onClick={() => removeWindow(id)} />
        </div>
      </div>
      
      <div 
        ref={editorRef}
        className="window-body"
        style={{
          margin: 0,
          padding: '0.5rem',
          height: 'calc(100% - 2rem)',
          backgroundColor: 'white',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          cursor: getCursorStyle(),
          userSelect: isDragging ? 'none' : 'text',
        }}
      >
        <EditorContent 
          editor={editor}
          className={`tiptap-editor ${isEditing ? 'editing' : ''}`}
          style={{
            flex: 1,
            overflow: 'auto',
            height: '100%',
            position: 'relative',
            pointerEvents: isDragging ? 'none' : 'auto',
          }}
        />
      </div>
    </div>
  );
});

TextWindow.displayName = 'TextWindow';

export default TextWindow;