import React, { forwardRef } from 'react'
import TextWindow from '@/components/TextWindow'
import { useThree } from '@react-three/fiber'

interface Window {
  id: number
  title: string
  text: string
  x: number
  y: number
  zIndex: number
  creationTime: Date
  width: number
  height: number
  isNew: boolean
}

interface WindowsContainerProps {
  windows: Window[]
  onClose: (id: number) => void
  onTextChange: (id: number, text: string) => void
  onTitleChange: (id: number, title: string) => void
  onPositionChange: (id: number, x: number, y: number) => void
  onResize: (id: number, width: number, height: number) => void
  scale: number
  updateCursorStyle: (style: string) => void
}

const WindowsContainer = forwardRef<HTMLDivElement, WindowsContainerProps>(
  ({
    windows,
    onClose,
    onTextChange,
    onTitleChange,
    onPositionChange,
    onResize,
    scale,
    updateCursorStyle,
  }, ref) => {
    const { camera, size } = useThree()

    console.log('WindowsContainer updateCursorStyle:', updateCursorStyle);

    return (
      <div ref={ref} className='relative w-full h-full'>
        {windows.map(window => (
          <TextWindow
            key={window.id}
            id={window.id}
            initialTitle={window.title}
            initialText={window.text}
            position={[window.x, window.y, 0]}
            zIndex={window.zIndex}
            onClose={() => onClose(window.id)}
            onMinimize={() => {}}
            onMaximize={() => {}}
            onTextChange={(text) => onTextChange(window.id, text)}
            onTitleChange={(title) => onTitleChange(window.id, title)}
            onPositionChange={(x, y) => onPositionChange(window.id, x, y)}
            scale={scale}
            creationTime={window.creationTime}
            onResize={(width, height) => onResize(window.id, width, height)}
            width={window.width}
            height={window.height}
            camera={camera}
            size={size}
            updateCursorStyle={updateCursorStyle}
            isNew={window.isNew}
          />
        ))}
      </div>
    )
  }
)

WindowsContainer.displayName = 'WindowsContainer';

export default WindowsContainer
