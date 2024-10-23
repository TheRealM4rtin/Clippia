import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { format } from 'date-fns'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import BulletList from '@tiptap/extension-bullet-list'
import ListItem from '@tiptap/extension-list-item'  
import Placeholder from '@tiptap/extension-placeholder'
import html2canvas from 'html2canvas'
import DOMPurify from 'isomorphic-dompurify';

import '@/app/tiptap.css'
import "xp.css/dist/98.css";
import '@/components/style.scss'

interface TextWindowProps {
  id: number
  initialTitle: string
  initialText: string
  position: [number, number, number]
  zIndex: number
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onTextChange: (text: string) => void
  onTitleChange: (title: string) => void
  onPositionChange: (x: number, y: number) => void
  scale: number
  creationTime: Date
  onResize: (width: number, height: number) => void
  width: number
  height: number
  camera: THREE.Camera | undefined
  size: { width: number; height: number } | undefined
  updateCursorStyle: (style: string) => void
  isNew?: boolean
}

/**
 * TextWindow component for displaying editable text content.
 * @param {TextWindowProps} props - The props for the TextWindow component.
 * @returns {React.ReactElement} The rendered TextWindow component.
 */
const TextWindow: React.FC<TextWindowProps> = (props) => {
  const {
    // eslint-disable-next-line
    id,
    initialTitle,
    initialText,
    position,
    zIndex,
    onClose,
    onMinimize,
    onMaximize,
    onTextChange,
    onTitleChange,
    onPositionChange,
    scale,
    creationTime,
    onResize,
    width,
    height,
    camera,
    size,
    updateCursorStyle,
    isNew,
  } = props

  console.log('TextWindow props:', props);
  console.log('updateCursorStyle:', updateCursorStyle);

  const [title, setTitle] = useState(initialTitle)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 })
  const [initialSize, setInitialSize] = useState({ width, height })
  const windowRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
      }),
      Markdown,
      BulletList,
      ListItem,
      Placeholder.configure({
        placeholder: initialText,
      })
    ],
    editorProps: {
      attributes: {
        class: 'windows98-text',
        style: 'height: 100%; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; padding: 4px;',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onTextChange(html)
    },
    autofocus: isNew ? 'end' : undefined,
  })

  const handleDragStart = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    setIsDragging(true)
    if (camera && size) {
      const worldPosition = new THREE.Vector3(position[0], position[1], 0)
      const screenPosition = worldPosition.project(camera)
      const x = (screenPosition.x + 1) * size.width / 2
      const y = (-screenPosition.y + 1) * size.height / 2
      setDragStart({ x: event.clientX - x, y: event.clientY - y })
    } else {
      setDragStart({ x: event.clientX, y: event.clientY })
    }
  }, [camera, size, position])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging && camera && size) {
      event.preventDefault()
      const x = (event.clientX - dragStart.x) / size.width * 2 - 1
      const y = -(event.clientY - dragStart.y) / size.height * 2 + 1
      const vector = new THREE.Vector3(x, y, 0).unproject(camera)
      onPositionChange(vector.x, vector.y)
    }
    if (isResizing) {
      event.preventDefault()
      const deltaX = (event.clientX - resizeStart.x) / scale
      const deltaY = (event.clientY - resizeStart.y) / scale
      
      const newWidth = Math.max(initialSize.width + deltaX, 200)
      const newHeight = Math.max(initialSize.height + deltaY, 150)

      const maxChange = 100 / scale
      const clampedWidth = Math.min(newWidth, initialSize.width + maxChange)
      const clampedHeight = Math.min(newHeight, initialSize.height + maxChange)

      onResize(clampedWidth, clampedHeight)
    }
  }, [isDragging, isResizing, dragStart, resizeStart, camera, size, scale, initialSize, onPositionChange, onResize])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const handleResizeStart = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    setIsResizing(true)
    setResizeStart({ x: event.clientX, y: event.clientY })
    setInitialSize({ width, height })
  }, [width, height])

  const sanitizeInput = (input: string): string => {
    return DOMPurify.sanitize(input);
  };

  const handleTitleChange = useCallback((event: React.FocusEvent<HTMLSpanElement>) => {
    const newTitle = sanitizeInput(event.target.textContent?.trim() || 'Untitled');
    if (newTitle.length > 50) {
      console.warn('Title too long, truncating');
      setTitle(newTitle.slice(0, 50));
    } else {
      setTitle(newTitle);
    }
    onTitleChange(newTitle);
  }, [onTitleChange]);

  const formattedCreationTime = format(creationTime, 'MMM d, yyyy HH:mm:ss')

  const handleEditorFocus = useCallback(() => {
    console.log('Editor focus, updateCursorStyle:', updateCursorStyle);
    if (typeof updateCursorStyle === 'function') {
      updateCursorStyle('text');
    } else {
      console.error('updateCursorStyle is not a function:', updateCursorStyle);
    }
  }, [updateCursorStyle]);

  const handleEditorBlur = useCallback(() => {
    updateCursorStyle('default')
  }, [updateCursorStyle])

  useEffect(() => {
    if (editor) {
      editor.on('focus', handleEditorFocus)
      editor.on('blur', handleEditorBlur)
    }
    return () => {
      if (editor) {
        editor.off('focus', handleEditorFocus)
        editor.off('blur', handleEditorBlur)
      }
    }
  }, [editor, handleEditorFocus, handleEditorBlur])

  const updateTextScale = useCallback(() => {
    if (windowRef.current) {
      const scaleFactor = 1 / scale;
      windowRef.current.style.transform = `scale(${scaleFactor})`;
      windowRef.current.style.transformOrigin = 'top left';
    }
  }, [scale]);

  useEffect(() => {
    updateTextScale();
  }, [scale, updateTextScale]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleExport = useCallback(async () => {
    if (windowRef.current) {
      try {
        // Set temporary styles for better export quality
        const element = windowRef.current;
        const originalTransform = element.style.transform;
        element.style.transform = 'none';
  
        const canvas = await html2canvas(element, {
          scale: 2, // Increase quality
          useCORS: true,
          backgroundColor: null,
          logging: false,
          windowWidth: width,
          windowHeight: height,
        });
  
        // Restore original styles
        element.style.transform = originalTransform;
  
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${format(creationTime, 'yyyyMMdd_HHmmss')}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png', 1.0);
      } catch (error) {
        console.error('Error exporting window:', error);
      }
    }
  }, [windowRef, title, creationTime, width, height]);





  return (
    <group position={position}>
      <Html
        transform
        occlude
        zIndexRange={[zIndex + 2, zIndex + 2]}
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        <div 
          ref={windowRef}
          className="window" 
          style={{ 
            width: '100%', 
            height: '100%', 
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
          onMouseEnter={() => updateCursorStyle('default')}
        >
          <div 
            className="title-bar" 
            onMouseDown={handleDragStart}
            style={{ cursor: 'move' }}
            onMouseEnter={() => updateCursorStyle('move')}
          >
            <span
              className="title-bar-text"
              contentEditable
              suppressContentEditableWarning
              onBlur={handleTitleChange}
            >
              {title}
            </span>
            <div className="title-bar-controls">
              <button aria-label="Minimize" onClick={(e) => { e.stopPropagation(); onMinimize(); }}></button>
              <button aria-label="Maximize" onClick={(e) => { e.stopPropagation(); onMaximize(); }}></button>
              <button aria-label="Close" onClick={(e) => { e.stopPropagation(); onClose(); }}></button>
            </div>
          </div>

          <div className="window-body" style={{ 
            flex: 1, 
            padding: '5px', 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column',
          }}>
            <EditorContent 
              editor={editor} 
              style={{ 
                flex: 1, 
                overflow: 'auto',
                fontSize: `${16 / scale}px`,
                lineHeight: `${24 / scale}px`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={() => updateCursorStyle('text')}
            />
          </div>
          <div className="status-bar">
            <p className="status-bar-field">Created: {formattedCreationTime}</p>
            {/* <ExportButton onExport={handleExport} /> */}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              cursor: 'se-resize',
              zIndex: 1000,
            }}
            onMouseDown={handleResizeStart}
            onMouseEnter={() => updateCursorStyle('se-resize')}
          />
        </div>
      </Html>
    </group>
  )
}

export default TextWindow
