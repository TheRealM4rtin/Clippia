import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface TextWindowProps {
  id: number
  initialTitle: string
  initialText: string
  position: [number, number, number]
  zIndex: number
  onClose: () => void
  onTextChange: (text: string) => void
  onTitleChange: (title: string) => void
  onPositionChange: (x: number, y: number) => void
  scale: number
}

const TextWindow: React.FC<TextWindowProps> = ({
  id,
  initialTitle,
  initialText,
  position,
  zIndex,
  onClose,
  onTextChange,
  onTitleChange,
  onPositionChange,
  scale,
}) => {
  const [text, setText] = useState(initialText)
  const [title, setTitle] = useState(initialTitle)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const windowRef = useRef<HTMLDivElement>(null)
  const { camera, size } = useThree()

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

  return (
    <group position={position}>
      <Html
        transform
        scale={scale}
        zIndexRange={[zIndex + 2, zIndex + 2]}
        style={{
          width: '400px',
          height: '300px',
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
            zIndex: zIndex + 2
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
              <button aria-label="Close" onClick={(e) => { e.stopPropagation(); onClose(); }}></button>
            </div>
          </div>
          <div className="window-body" style={{ height: 'calc(100% - 30px)', padding: '10px' }}>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                onTextChange(e.target.value)
              }}
              style={{ width: '100%', height: '100%', resize: 'none', border: 'none' }}
            />
          </div>
        </div>
      </Html>
    </group>
  )
}

export default TextWindow