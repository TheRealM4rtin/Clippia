import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { format } from 'date-fns'

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
}

const TextWindow: React.FC<TextWindowProps> = ({
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
}) => {
  const [text, setText] = useState(initialText)
  const [title, setTitle] = useState(initialTitle)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 })
  const windowRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { camera, size } = useThree()
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 })

  const handleTitleBarMouseDown = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    setIsDragging(true)
    const worldPosition = new THREE.Vector3(position[0], position[1], 0)
    const screenPosition = worldPosition.project(camera)
    const x = (screenPosition.x + 1) * size.width / 2
    const y = (-screenPosition.y + 1) * size.height / 2
    setDragStart({ x: event.clientX - x, y: event.clientY - y })
  }, [camera, position, size])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging) {
      event.preventDefault()
      const x = (event.clientX - dragStart.x) / size.width * 2 - 1
      const y = -(event.clientY - dragStart.y) / size.height * 2 + 1
      const vector = new THREE.Vector3(x, y, 0).unproject(camera)
      onPositionChange(vector.x, vector.y)
    }
  }, [isDragging, dragStart, onPositionChange, camera, size])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleTitleChange = useCallback((event: React.FocusEvent<HTMLSpanElement>) => {
    const newTitle = event.target.textContent || 'Untitled'
    setTitle(newTitle)
    onTitleChange(newTitle)
  }, [onTitleChange])

  const formattedCreationTime = format(creationTime, 'MMM d, yyyy HH:mm:ss')

  const handleResizeMouseDown = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    setIsResizing(true)
    setResizeStart({ x: event.clientX, y: event.clientY })
    setInitialSize({ width: width, height: height })
    console.log('Resize started')
  }, [width, height])

  const handleResizeMouseMove = useCallback((event: MouseEvent) => {
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
      console.log('Resizing', clampedWidth, clampedHeight)
    }
  }, [isResizing, scale, resizeStart, initialSize, onResize])

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false)
    console.log('Resize ended')
  }, [])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMouseMove)
      window.addEventListener('mouseup', handleResizeMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMouseMove)
      window.removeEventListener('mouseup', handleResizeMouseUp)
    }
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp])

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
        >
          <div 
            className="title-bar" 
            onMouseDown={handleTitleBarMouseDown}
            style={{ cursor: 'move' }}
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
          <div className="window-body" style={{ flex: 1, padding: '10px', overflow: 'hidden' }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                onTextChange(e.target.value)
              }}
              style={{
                width: '100%',
                height: '100%',
                resize: 'none',
                border: 'none',
                padding: '4px 0 0 4px'
              }}
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
              zIndex: 1000, // Ensure it's on top
            }}
            onMouseDown={handleResizeMouseDown}
          />
        </div>
      </Html>
    </group>
  )
}

export default TextWindow
