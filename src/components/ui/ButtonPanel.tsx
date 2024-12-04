import React from 'react'

interface ButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({ onClick, children }) => (
  <button 
    onClick={onClick}
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
    {children}
  </button>
)

interface ButtonPanelProps {
  children: React.ReactNode
}

const ButtonPanel: React.FC<ButtonPanelProps> & { Button: typeof Button } = ({ children }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
    {children}
  </div>
)

ButtonPanel.Button = Button

export default ButtonPanel