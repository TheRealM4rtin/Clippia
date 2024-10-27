import React, { useCallback, useState, useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'
import { Window } from '@/types/Window'
import { useAppStore } from '@/lib/store'

interface TextWindowProps {
  window: Window
}

const TextWindow: React.FC<TextWindowProps> = ({ window }) => {
  const { updateWindow, removeWindow, viewportSize } = useAppStore()
  const [isDragging, setIsDragging] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('TextWindow rendered:', window);
    console.log('Viewport size:', viewportSize);
  }, [window, viewportSize]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
      }),
      Markdown,
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder: 'Type here to start...',
      }),
    ],
    content: window.content,
    editorProps: {
      attributes: {
        class: 'windows98-text',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      updateWindow(window.id, { content: html })
    },
    autofocus: window.isNew, // Focus the editor if it's a new window
  })

  useEffect(() => {
    if (editor && window.isNew) {
      editor.commands.focus('end')
      updateWindow(window.id, { isNew: false })
    }
  }, [editor, window.isNew, window.id, updateWindow])

  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLButtonElement) return; // Prevent dragging when clicking buttons
    setIsDragging(true)
    console.log('Drag started');
    // Store the initial mouse position and window position
    const startX = e.clientX - window.position.x * viewportSize.width;
    const startY = e.clientY - window.position.y * viewportSize.height;
    const handleDrag = (e: MouseEvent) => {
      const newX = (e.clientX - startX) / viewportSize.width;
      const newY = (e.clientY - startY) / viewportSize.height;
      updateWindow(window.id, { position: { x: newX, y: newY } });
    };
    const handleDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  }, [updateWindow, window.id, viewportSize, window.position.x, window.position.y])

  const windowStyle = {
    width: `${window.size.width * viewportSize.width}px`,
    height: `${window.size.height * viewportSize.height}px`,
    position: 'fixed' as const,
    zIndex: window.zIndex,
    left: `${window.position.x * viewportSize.width}px`,
    top: `${window.position.y * viewportSize.height}px`,
    backgroundColor: 'white',
    border: '2px solid #000080',
  };

  console.log('Window style:', windowStyle);

  return (
    <div
      className="window"
      style={windowStyle}
      onMouseDown={handleDragStart}
    >
      <div className="title-bar" style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
        <div className="title-bar-text">{window.title}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close" onClick={() => removeWindow(window.id)}></button>
        </div>
      </div>
      <div className="window-body" style={{ 
        padding: '0.5rem', 
        height: 'calc(100% - 2rem)', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'default',
      }}>
        <EditorContent 
          editor={editor} 
          ref={editorRef}
          style={{ 
            flex: 1, 
            overflow: 'auto',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        />
      </div>
    </div>
  )
}

export default TextWindow
