import React, { useCallback, useEffect, useRef, useState, memo, useMemo } from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { useAppStore } from '@/lib/store';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import BulletList from '@tiptap/extension-bullet-list';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import TiptapImage from '@tiptap/extension-image';
import Dropcursor from '@tiptap/extension-dropcursor';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { exportToMarkdown } from '@/lib/exportUtils';
import 'katex/dist/katex.min.css';
import { LatexNode } from '@/components/nodes/LatexNode';
import { WindowData, DragStartPos } from '@/types/window';
import {
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  WINDOW_PADDING,
  ZOOM_ANIMATION_DURATION,
  MAX_ZOOM_LEVEL,
  AUTOSAVE_DELAY,
  IMAGE_PADDING
} from '@/lib/constants/constants';
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
} from '@/lib/utils/components/utils';
import styles from '@/styles/animations.module.css';

const lowlight = createLowlight(common);

// Rate limiter for autosave
const saveRateLimit = new RateLimit(60 * 1000, 500);


const TextWindow: React.FC<NodeProps & { data: WindowData }> = memo(({ id, data, selected }) => {
  const { updateWindow, removeWindow, ui, setResizing } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragStartPosRef = useRef<DragStartPos | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const previousContentRef = useRef<string>(data.content || '');
  const { setViewport, getViewport } = useReactFlow();
  const draggedImageRef = useRef<string | null>(null);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const MIN_WINDOW_WIDTH = 200;
  const MIN_WINDOW_HEIGHT = 150;
  
  const debouncedSave = useMemo(() => {
    return debounce((content: string, windowId: string) => {
      if (saveRateLimit.canProceed() && hasContentChanged(previousContentRef.current, content)) {
        try {
          updateWindow(windowId, { content: sanitizeHtml(content) });
          saveToLocalStorage(`backup_${windowId}`, content);
          previousContentRef.current = content;
        } catch (error) {
          reportError(error as Error, { windowId });
        }
      }
    }, AUTOSAVE_DELAY);
  }, [updateWindow]);

  // Editor Configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        codeBlock: false,
        horizontalRule: false,
        dropcursor: false,
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
        debouncedSave(editor.getHTML(), id);
      }
    },
    immediatelyRender: false
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
    const target = e.target as HTMLElement;
    const resizeType = target.getAttribute('data-resize');
    
    if (resizeType) {
      e.stopPropagation();
      e.preventDefault();
      
      if (!windowRef.current) return;
      
      const rect = windowRef.current.getBoundingClientRect();
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height
      };
      
      setResizeDirection(resizeType);
      setResizing(true);
      return;
    }
    
    if (e.button !== 2 && editorRef.current?.contains(e.target as Node)) {
      return;
    }
    
    if (!ui.isResizing) {
      e.stopPropagation();
      e.preventDefault();
      const rect = windowRef.current?.getBoundingClientRect();
      if (rect) {
        dragStartPosRef.current = {
          x: e.clientX,
          y: e.clientY,
          offsetX: e.clientX - rect.left,
          offsetY: e.clientY - rect.top
        };
        setIsDragging(true);
      }
    }
  }, [ui.isResizing, setResizing]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!windowRef.current) return;
    
    const rect = windowRef.current.getBoundingClientRect();
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height
    };
    
    setResizeDirection(direction);
    setResizing(true);
  }, [setResizing]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!ui.isResizing || !resizeStartRef.current) return;

    e.preventDefault();
    e.stopPropagation();
    
    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;
    
    let newWidth = resizeStartRef.current.width;
    let newHeight = resizeStartRef.current.height;
    
    switch (resizeDirection) {
      case 'right':
        newWidth = Math.max(MIN_WINDOW_WIDTH, resizeStartRef.current.width + deltaX);
        break;
      case 'bottom':
        newHeight = Math.max(MIN_WINDOW_HEIGHT, resizeStartRef.current.height + deltaY);
        break;
      case 'bottomRight':
        newWidth = Math.max(MIN_WINDOW_WIDTH, resizeStartRef.current.width + deltaX);
        newHeight = Math.max(MIN_WINDOW_HEIGHT, resizeStartRef.current.height + deltaY);
        break;
    }
    
    updateWindow(id, {
      size: { width: newWidth, height: newHeight }
    });
  }, [ui.isResizing, resizeDirection, updateWindow, id]);

  const handleResizeMouseUp = useCallback(() => {
    setResizing(false);
    setResizeDirection(null);
    resizeStartRef.current = null;
  }, [setResizing]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && dragStartPosRef.current) {
      e.preventDefault();
      e.stopPropagation();
      
      const newX = e.clientX - dragStartPosRef.current.offsetX;
      const newY = e.clientY - dragStartPosRef.current.offsetY;
      
      updateWindow(id, {
        position: { x: newX, y: newY }
      });
    }
  }, [isDragging, updateWindow, id]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      dragStartPosRef.current = null;
    }
  }, [isDragging]);

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

  // Add this function to calculate viewport-adjusted position
  const calculateViewportPosition = useCallback(() => {
    if (data.isNew) {
      const viewport = getViewport();
      const viewportCenterX = -viewport.x * viewport.zoom + window.innerWidth / 2;
      const viewportCenterY = -viewport.y * viewport.zoom + window.innerHeight / 2;

      // Calculate window dimensions
      const windowWidth = data.size?.width ?? DEFAULT_WINDOW_WIDTH;
      const windowHeight = data.size?.height ?? DEFAULT_WINDOW_HEIGHT;

      // Calculate position to center the window in the current viewport
      const newX = (viewportCenterX - windowWidth / 2) / viewport.zoom;
      const newY = (viewportCenterY - windowHeight / 2) / viewport.zoom;

      return { x: newX, y: newY };
    }
    return null;
  }, [data.isNew, data.size, getViewport]);

  // Modify the existing useEffect for new windows
  useEffect(() => {
    if (data.isNew) {
      const newPosition = calculateViewportPosition();
      if (newPosition) {
        updateWindow(id, {
          position: newPosition,
          isNew: false
        });
      }
      zoomToWindow();
    }
  }, [data.isNew, calculateViewportPosition, zoomToWindow, id, updateWindow]);

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

  useEffect(() => {
    if (ui.isResizing) {
      window.addEventListener('mousemove', handleResizeMouseMove);
      window.addEventListener('mouseup', handleResizeMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleResizeMouseMove);
        window.removeEventListener('mouseup', handleResizeMouseUp);
      };
    }
  }, [ui.isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  const ResizeHandles = () => {
    return (
      <>
        <div
          className={styles.resizeHandle}
          style={{
            position: 'absolute',
            right: -5,
            top: '50%',
            width: 10,
            height: 20,
            transform: 'translateY(-50%)',
            cursor: 'ew-resize',
            backgroundColor: 'transparent',
            zIndex: 1000
          }}
          data-resize="right"
          onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
        />
        <div
          className={styles.resizeHandle}
          style={{
            position: 'absolute',
            bottom: -5,
            left: '50%',
            width: 20,
            height: 10,
            transform: 'translateX(-50%)',
            cursor: 'ns-resize',
            backgroundColor: 'transparent',
            zIndex: 1000
          }}
          data-resize="bottom"
          onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
        />
        <div
          className={styles.resizeHandle}
          style={{
            position: 'absolute',
            right: -5,
            bottom: -5,
            width: 10,
            height: 10,
            cursor: 'se-resize',
            backgroundColor: 'transparent',
            zIndex: 10000
          }}
          data-resize="bottomRight"
          onMouseDown={(e) => handleResizeMouseDown(e, 'bottomRight')}
        />
      </>
    );
  };

  return (
    <div 
      ref={windowRef}
      className={`window ${styles.windowHoverEffect} ${styles.light} ${styles.windowAnimation}`}
      style={{
        width: data.size?.width ?? DEFAULT_WINDOW_WIDTH,
        height: data.size?.height ?? DEFAULT_WINDOW_HEIGHT,
        backgroundColor: 'white',
        border: '2px solid #000080',
        position: 'relative',
        zIndex: typeof data.zIndex === 'number' ? Math.min(Math.max(data.zIndex, 1), 9999) : 1,
        outline: selected ? '2px solid #000080' : 'none',
        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)',
        overflow: 'visible',
        pointerEvents: 'auto',
        cursor: isDragging ? 'move' : 'default'
      }}
      onMouseDown={handleWindowMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="title-bar">
        <div className="title-bar-text">{data.title}</div>
        <div className="title-bar-controls">
          <span 
            aria-label="Export" 
            onClick={handleExport} 
            style={{ 
              marginRight: '5px',
              fontSize: '10px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-block'
            }}
          >
            export
          </span>
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
          overflow: 'auto',
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
      {!data.isReadOnly && <ResizeHandles />}
    </div>
  );
});

TextWindow.displayName = 'TextWindow';

export default TextWindow;