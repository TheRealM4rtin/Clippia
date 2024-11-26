import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const lowlight = createLowlight(all);

interface WindowData {
  id: string;
  title: string;
  content?: string;
  isReadOnly?: boolean;
  isNew?: boolean;
  size?: {
    width: number;
    height: number;
  };
  zIndex?: number;
  position?: {
    x: number;
    y: number;
  };
}

const TextWindow: React.FC<NodeProps & { data: WindowData }> = ({ id, data, selected }) => {
  const { updateWindow, removeWindow } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { setViewport } = useReactFlow();
  const draggedImageRef = useRef<string | null>(null);

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
    ],
    content: data.content || '',
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
        updateWindow(id, { content: editor.getHTML() });
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none',
        spellcheck: 'false',
      },
      handleDOMEvents: {
        mousedown: (view, event) => {
          event.stopPropagation();
          return false;
        },
        dragstart: (view, event) => {
          const target = event.target as HTMLElement;
          if (target.tagName === 'IMG') {
            draggedImageRef.current = (target as HTMLImageElement).src;
            return false;
          }
          return true;
        },
      },
    },
  });

  // Window zooming functionality
  const zoomToWindow = useCallback(() => {
    const node = document.getElementById(id);
    if (node) {
      const bounds = node.getBoundingClientRect();
      const padding = 50;
      const targetZoom = Math.min(
        (window.innerWidth - padding * 2) / bounds.width,
        (window.innerHeight - padding * 2) / bounds.height,
        1.2
      );

      const x = -(bounds.left + bounds.width / 2 - window.innerWidth / 2) / targetZoom;
      const y = -(bounds.top + bounds.height / 2 - window.innerHeight / 2) / targetZoom;

      setViewport({ x, y, zoom: targetZoom }, { duration: 800 });
    }
  }, [id, setViewport]);

  // Image handling functions
  const processImage = useCallback((imgSrc: string, file?: File) => {
    const img = new window.Image();
    img.src = imgSrc;
    
    img.onload = () => {
      if (editor) {
        const windowWidth = data.size?.width ?? 300;
        const maxWidth = windowWidth - 40;
        const ratio = maxWidth / img.width;
        const width = Math.floor(img.width * ratio);
        const height = Math.floor(img.height * ratio);

        editor.chain()
          .focus()
          .setImage({
            src: imgSrc,
            alt: file?.name || 'Dragged image',
          })
          .updateAttributes('image', {
            width: width,
            height: height
          })
          .insertContent('<p></p>')
          .focus()
          .run();
      }
    };
  }, [editor, data.size]);

  // Event handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              processImage(event.target.result.toString(), file);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    } else if (draggedImageRef.current) {
      processImage(draggedImageRef.current);
      draggedImageRef.current = null;
    }
  }, [processImage]);

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
      
      if (deltaX > 5 || deltaY > 5) {
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
      const content = editor.getHTML();
      await exportToMarkdown(data.title, content);
    }
  }, [editor, data.title]);

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

  return (
    <div 
      ref={windowRef}
      className="window"
      style={{
        width: data.size?.width ?? 300,
        height: data.size?.height ?? 200,
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
            style={{ width: '25px', height: '25px', cursor: 'nw-resize', border: 'none', background: 'transparent' }} 
            onResize={(_, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <NodeResizeControl 
            position="top-right" 
            style={{ width: '25px', height: '25px', cursor: 'ne-resize', border: 'none', background: 'transparent' }} 
            onResize={(_, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <NodeResizeControl 
            position="bottom-left" 
            style={{ width: '25px', height: '25px', cursor: 'sw-resize', border: 'none', background: 'transparent' }} 
            onResize={(_, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <NodeResizeControl 
            position="bottom-right" 
            style={{ width: '25px', height: '25px', cursor: 'se-resize', border: 'none', background: 'transparent' }} 
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
};

export default TextWindow;