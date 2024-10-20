import React, { useState } from 'react'
import Feedback from './Feedback'

interface PanelProps {
  windowCount: number
  x: number
  y: number
  scale: number
  onAddWindow: () => void
  onResetView: () => void
}

const Panel: React.FC<PanelProps> = ({ 
  windowCount, x, y, scale, onAddWindow, onResetView
}) => {
  const [activeTab, setActiveTab] = useState('menu');

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
    fontFamily: '"Pixelated MS Sans Serif", Arial',
    fontSize: '11px',
    fontWeight: 'normal' as const,
    color: 'black',
  });

  const panelStyle = {
    fontFamily: '"Pixelated MS Sans Serif", Arial',
  };

  return (
    <div className="fixed top-4 left-4 z-50" style={panelStyle}>
      <div className="flex">
        <div 
          style={tabStyle(activeTab === 'menu')}
          onClick={() => setActiveTab('menu')}
        >
          Menu
        </div>
        <div 
          style={tabStyle(activeTab === 'feedback')}
          onClick={() => setActiveTab('feedback')}
        >
          Feedback
        </div>
        <div 
          style={tabStyle(activeTab === 'login')}
          onClick={() => setActiveTab('login')}
        >
          Login
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
        fontSize: '11px',
        color: 'black',
      }}>
        {activeTab === 'menu' && (
          <>
            <p>Windows: {windowCount}</p>
            <p>Scale: {scale.toFixed(2)}</p>
            <p>Position: ({x.toFixed(0)}, {y.toFixed(0)})</p>
            <button 
              onClick={onAddWindow}
              className="window-button"
              style={{
                fontFamily: '"Pixelated MS Sans Serif", Arial',
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
                fontFamily: '"Pixelated MS Sans Serif", Arial',
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
          <div>
            <p>Fenestro.io v1.0</p>
            <ul style={{ textDecoration: 'underline' }}>Features</ul>
            <div>
              <li>Infinite whiteboard</li>
              <li>Windows 98-style UI</li>
              <li>Resizable windows</li>
              <li>Drag and drop windows</li>
              <li>Tiptap rich text editor</li>
            </div>
            <ul style={{ textDecoration: 'underline' }}>Roadmap</ul>
            <div>
              <li>Amiga music player</li>
            </div>
              
            <p>Made with ❤️ by <a href="https://x.com/mrtincss">Martin</a></p>
          </div>
        )}
        {activeTab === 'feedback' && (
          <Feedback />
        )}
      </div>
    </div>
  )
}

export default Panel
