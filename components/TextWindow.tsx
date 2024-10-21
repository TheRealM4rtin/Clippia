import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { format } from 'date-fns'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import BulletList from '@tiptap/extension-bullet-list'
import ListItem from '@tiptap/extension-list-item'
import '@/app/tiptap.css'

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
}

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
    ],
    content: initialText || 'New Window Content',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onTextChange(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none',
        style: 'height: 100%; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; background-color: white; color: black; padding: 4px;',
      },
    },
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

  const handleTitleChange = useCallback((event: React.FocusEvent<HTMLSpanElement>) => {
    const newTitle = event.target.textContent || 'Untitled'
    setTitle(newTitle)
    onTitleChange(newTitle)
  }, [onTitleChange])

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

  return (
    <group position={position}>
      <Html
        transform
        scale={scale}
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
            transform: `scale(${1 / scale})`,
            transformOrigin: 'top left',
            zIndex: zIndex + 2,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
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
          <div className="window-body" style={{ flex: 1, padding: '5px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <EditorContent 
              editor={editor} 
              style={{ flex: 1, overflow: 'auto' }}
              onMouseEnter={() => updateCursorStyle('text')}
            />
          </div>
          <div className="status-bar">
            <p className="status-bar-field">Created: {formattedCreationTime}</p>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              cursor: 'se-resize',
              background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.4) 50%)',
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
