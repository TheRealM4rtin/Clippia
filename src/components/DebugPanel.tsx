import React, { useState } from 'react'

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
  const [activeTab, setActiveTab] = useState('debug');

  const tabStyle = (isActive: boolean) => ({
    padding: '1px 7px',
    cursor: 'pointer',
    backgroundColor: isActive ? 'white' : '#D4D0C8',
    border: '1px solid #0054E3',
    borderBottom: isActive ? 'none' : '1px solid #0054E3',
    borderTopLeftRadius: '3px',
    borderTopRightRadius: '3px',
    marginRight: '-1px',
    position: 'relative' as const,
    top: isActive ? '1px' : '0',
    zIndex: isActive ? 2 : 1,
    fontFamily: '"MS Sans Serif", Arial, sans-serif',
    fontSize: '11px',
    fontWeight: 'normal' as const,
    color: 'black',
  });

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="flex">
        <div 
          style={tabStyle(activeTab === 'debug')}
          onClick={() => setActiveTab('debug')}
        >
          Debug
        </div>
        <div 
          style={tabStyle(activeTab === 'about')}
          onClick={() => setActiveTab('about')}
        >
          About
        </div>
      </div>
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #0054E3',
        padding: '6px',
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: '11px',
        color: 'black',
      }}>
        {activeTab === 'debug' && (
          <>
            <p>Windows: {windowCount}</p>
            <p>Scale: {scale.toFixed(2)}</p>
            <p>Position: ({x.toFixed(0)}, {y.toFixed(0)})</p>
            <button 
              onClick={onAddWindow}
              className="window-button"
              style={{
                fontFamily: '"MS Sans Serif", Arial, sans-serif',
                fontSize: '11px',
                color: 'black',
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
                fontFamily: '"MS Sans Serif", Arial, sans-serif',
                fontSize: '11px',
                color: 'black',
                backgroundColor: '#D4D0C8',
                border: '1px solid #808080',
                padding: '2px 8px'
              }}
            >
              Reset View
            </button>
          </>
        )}
        {activeTab === 'about' && (
          <p>Debug Panel v1.0</p>
        )}
      </div>
    </div>
  )
}

export default DebugPanel