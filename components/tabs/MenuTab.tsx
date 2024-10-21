import React from 'react'
import ButtonPanel from '@/components/ButtonPanel'

interface MenuTabProps {
  windowCount: number
  x: number
  y: number
  scale: number
  onAddWindow: () => void
  onResetView: () => void
}

const MenuTab: React.FC<MenuTabProps> = ({ 
  windowCount, x, y, scale, onAddWindow, onResetView 
}) => {
  const handleButtonClick = (action: () => void) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Button clicked'); // Add this line for debugging
    action();
  };

  return (
    <div style={{ pointerEvents: 'auto' }}>
      <p>Windows: {windowCount}</p>
      <p>Scale: {scale.toFixed(2)}</p>
      <p>Position: ({x.toFixed(0)}, {y.toFixed(0)})</p>
      <ButtonPanel>
        <ButtonPanel.Button onClick={handleButtonClick(onAddWindow)}>
          Add Window
        </ButtonPanel.Button>
        <ButtonPanel.Button onClick={handleButtonClick(onResetView)}>
          Reset View
        </ButtonPanel.Button>
      </ButtonPanel>
    </div>
  )
}

export default MenuTab
