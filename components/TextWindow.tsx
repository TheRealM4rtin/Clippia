import React, { useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizeControl } from '@xyflow/react';
import { useAppStore } from '@/lib/store';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import BulletList from '@tiptap/extension-bullet-list';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Image from '@tiptap/extension-image';
import Dropcursor from '@tiptap/extension-dropcursor';

// Register commonly used languages
const lowlight = createLowlight(all)

interface WindowData {
  size?: {
    width?: number;
    height?: number;
  };
  // ... other properties
}

const TextWindow: React.FC<NodeProps & { data: WindowData }> = ({ id, data, selected }) => {
  const { updateWindow, removeWindow } = useAppStore();

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
      Image.configure({
        inline: false,
        allowBase64: true,
        draggable: false,
        HTMLAttributes: {
          class: 'resizable-image',
        },
      }),
      Dropcursor.configure({
        class: 'drop-cursor',
      }),
    ],
    content: data.content || '',
    editable: !data.isReadOnly,
    
    onUpdate: ({ editor }) => {
      if (!data.isReadOnly) {
        const html = editor.getHTML();
        updateWindow(id, { content: html });
      }
    },
    autofocus: false,  // Remove autofocus from here
  });

  useEffect(() => {
    if (editor && data.isNew && !data.isReadOnly) {
      setTimeout(() => {
        editor.commands.focus('end');  // Directly focus the editor
      }, 0);  // Use a timeout to ensure the editor is ready
      updateWindow(id, { isNew: false });
    }
  }, [editor, data.isNew, data.isReadOnly, id, updateWindow]);

  useEffect(() => {
    if (selected && editor) {
      editor.commands.focus('end');
    }
  }, [selected, editor]);

  const handleClose = useCallback(() => {
    removeWindow(id);
  }, [id, removeWindow]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (editor) {
      editor.commands.focus('end');
    }
  }, [editor]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result && editor) {
            // Use the HTML Image constructor instead of TipTap's Image
            const img = new window.Image();
            const imageUrl = event.target.result.toString();
            img.src = imageUrl;
            
            img.onload = () => {
              // Get window dimensions
              const windowWidth = data.size?.width ?? 300;
              const windowHeight = data.size?.height ?? 200;
              
              // Calculate scaling ratio
              const maxWidth = windowWidth - 40; // Account for padding
              const maxHeight = windowHeight - 100; // Account for title bar and padding
              
              const widthRatio = maxWidth / img.width;
              const heightRatio = maxHeight / img.height;
              const ratio = Math.min(widthRatio, heightRatio, 1); // Don't upscale
              
              // Set resized dimensions
              const width = Math.floor(img.width * ratio);
              const height = Math.floor(img.height * ratio);
              
              // Insert image with calculated dimensions
              editor.chain()
                .focus()
                .setImage({ 
                  src: imageUrl,
                  alt: file.name,
                  // Use HTMLAttributes for dimensions instead of direct props
                  HTMLAttributes: {
                    width: width,
                    height: height,
                    'data-original-width': img.width,
                    'data-original-height': img.height
                  }
                })
                .run();
            };
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [editor, data.size]);

  useEffect(() => {
    if (editor && data.size) {
      // Find all images in the editor
      const images = editor.view.dom.getElementsByTagName('img');
      const windowWidth = data.size.width ?? 300;
      const maxWidth = windowWidth - 40; // Account for padding

      Array.from(images).forEach(img => {
        const originalWidth = parseInt(img.getAttribute('data-original-width') || img.width.toString());
        const originalHeight = parseInt(img.getAttribute('data-original-height') || img.height.toString());
        
        // Only store original dimensions once
        if (!img.hasAttribute('data-original-width')) {
          img.setAttribute('data-original-width', originalWidth.toString());
          img.setAttribute('data-original-height', originalHeight.toString());
        }

        // Calculate new dimensions
        const ratio = maxWidth / originalWidth;
        const newWidth = Math.min(originalWidth, maxWidth);
        const newHeight = Math.floor(originalHeight * ratio);

        // Apply new dimensions if they're different
        if (img.width !== newWidth) {
          img.style.width = `${newWidth}px`;
          img.style.height = `${newHeight}px`;
        }
      });
    }
  }, [editor, data.size]);

  // Add image resize handler
  const handleImageResize = useCallback((imageElement: HTMLImageElement, width: number) => {
    if (editor) {
      const { state, dispatch } = editor.view;
      
      state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
        if (node.type.name === 'image' && node.attrs.src === imageElement.src) {
          const height = (width / imageElement.naturalWidth) * imageElement.naturalHeight;
          
          dispatch(state.tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            width: Math.round(width),
            height: Math.round(height),
          }));
          return false;
        }
        return true;
      });
    }
  }, [editor]);

  // Add mouse handlers for image resizing
  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom;
      let isResizing = false;
      let currentImage: HTMLImageElement | null = null;
      let startX = 0;
      let startWidth = 0;

      const handleMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('image-resize-handle')) {
          e.preventDefault();
          isResizing = true;
          currentImage = target.parentElement?.querySelector('img') || null;
          startX = e.pageX;
          startWidth = currentImage?.width || 0;
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing || !currentImage) return;
        
        const deltaX = e.pageX - startX;
        const newWidth = Math.max(50, startWidth + deltaX);
        handleImageResize(currentImage, newWidth);
      };

      const handleMouseUp = () => {
        isResizing = false;
        currentImage = null;
      };

      editorElement.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        editorElement.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [editor, handleImageResize]);

  return (
    <div 
      className="window"
      style={{
        width: data.size?.width ?? 300,
        height: data.size?.height ?? 200,
        backgroundColor: 'white',
        border: '2px solid #000080',
        position: 'relative',
        zIndex: typeof data.zIndex === 'number' ? data.zIndex : 1,
        outline: selected ? '2px solid #000080' : 'none',
        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)',
      }}
      onClick={handleClick}
    >
      {!data.isReadOnly && (
        <>
          {/* Custom resize controls with larger interaction areas */}
          <NodeResizeControl 
            position="top-left" 
            style={{ width: '25px', height: '25px', cursor: 'nw-resize', border: 'none', background: 'transparent' }} 
            onResize={(event, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <NodeResizeControl 
            position="top-right" 
            style={{ width: '25px', height: '25px', cursor: 'ne-resize', border: 'none', background: 'transparent' }} 
            onResize={(event, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <NodeResizeControl 
            position="bottom-left" 
            style={{ width: '25px', height: '25px', cursor: 'sw-resize', border: 'none', background: 'transparent' }} 
            onResize={(event, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <NodeResizeControl 
            position="bottom-right" 
            style={{ width: '25px', height: '25px', cursor: 'se-resize', border: 'none', background: 'transparent' }} 
            onResize={(event, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <Handle 
            type="target" 
            position={Position.Top} 
            id="top-target"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="source" 
            position={Position.Top} 
            id="top-source"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="target" 
            position={Position.Bottom} 
            id="bottom-target"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="bottom-source"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="target" 
            position={Position.Left} 
            id="left-target"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="source" 
            position={Position.Left} 
            id="left-source"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="target" 
            position={Position.Right} 
            id="right-target"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="source" 
            position={Position.Right} 
            id="right-source"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
        </>
      )}

      
      
      <div className="title-bar">
        <div className="title-bar-text">{data.title as string}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize" />
          <button aria-label="Maximize" />
          <button aria-label="Close" onClick={handleClose} />
        </div>
      </div>
      <div 
        className="window-body"
        style={{
          margin: 0,
          padding: '0.5rem',
          height: 'calc(100% - 2rem)',
          backgroundColor: 'white',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          cursor: data.isReadOnly ? 'default' : 'text',
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <EditorContent 
          editor={editor}
          className="tiptap-editor"
          style={{
            flex: 1,
            overflow: 'auto',
            height: '100%',
            position: 'relative',
          }}
        />
      </div>
    </div>
  );
};

export default TextWindow;
