// DebugPanel.tsx

import React from 'react'

interface DebugPanelProps {
  windowCount: number
  x: number
  y: number
  scale: number
  onAddWindow: () => void
  onResetView: () => void
}

const DebugPanel: React.FC<DebugPanelProps> = ({ 
  windowCount, x, y, scale, onAddWindow, onResetView
}) => {
  return (
    <div className="fixed top-4 left-4 z-50 bg-white p-2 rounded window" style={{
      fontFamily: '"Tahoma", "MS Sans Serif", sans-serif',
      fontSize: '11px',
      border: '1px solid #0054E3',
      boxShadow: '2px 2px 5px rgba(0,0,0,0.2)'
    }}>
      <p>Windows: {windowCount}</p>
      <p>Scale: {scale.toFixed(2)}</p>
      <p>
        Position: ({x.toFixed(0)}, {y.toFixed(0)})
      </p>
      <button 
        onClick={onAddWindow}
        className="window-button"
        style={{
          backgroundColor: '#D4D0C8',
          border: '1px solid #808080',
          padding: '2px 8px',
          marginRight: '4px'
        }}
      >
        Add Window
      </button>
      <button 
        onClick={onResetView}
        className="window-button"
        style={{
          backgroundColor: '#D4D0C8',
          border: '1px solid #808080',
          padding: '2px 8px'
        }}
      >
        Reset View
      </button>
    </div>
  )
}

export default DebugPanel