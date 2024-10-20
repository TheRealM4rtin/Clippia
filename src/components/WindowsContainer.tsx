import React, { forwardRef } from 'react'
import TextWindow from './TextWindow'

interface WindowsContainerProps {
  windows: { id: number; text: string; x: number; y: number }[]
  onClose: (id: number) => void
  onTextChange: (id: number, text: string) => void
}

const WindowsContainer = forwardRef<HTMLDivElement, WindowsContainerProps>(
  ({ windows, onClose, onTextChange }, ref) => {
    return (
      <div ref={ref} className="relative w-full h-full">
        {windows.map(window => (
          <TextWindow
            key={window.id}
            id={window.id}
            initialText={window.text}
            x={window.x}
            y={window.y}
            onClose={() => onClose(window.id)}
            onTextChange={(text) => onTextChange(window.id, text)}
          />
        ))}
      </div>
    )
  }
)

WindowsContainer.displayName = 'WindowsContainer'

export default WindowsContainer
