import React from 'react'
import ButtonPanel from '@/components/ButtonPanel'

interface MenuTabProps {
  windowCount: number
  x: number
  y: number
  scale: number
  onAddWindow: () => void
  onResetView: () => void
  colorBackground: boolean
  toggleColorBackground: () => void
  disableAnimation: boolean
  toggleCloudAnimation: () => void
}

const MenuTab: React.FC<MenuTabProps> = ({ 
  windowCount, x, y, scale, onAddWindow, onResetView,
  colorBackground, toggleColorBackground, disableAnimation, toggleCloudAnimation
}) => {
  const handleButtonClick = (action: () => void) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
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
      <div style={{ marginTop: '10px' }}>
        <p>Color Background:</p>
        <div className="field-row">
          <input 
            id="radio-color-yes" 
            type="radio" 
            name="color-background"
            checked={colorBackground}
            onChange={() => toggleColorBackground()}
          />
          <label htmlFor="radio-color-yes">Yes</label>
        </div>
        <div className="field-row">
          <input 
            id="radio-color-no" 
            type="radio" 
            name="color-background"
            checked={!colorBackground}
            onChange={() => toggleColorBackground()}
          />
          <label htmlFor="radio-color-no">No</label>
        </div>
      </div>
      {!colorBackground && (
        <div style={{ marginTop: '5px' }}>
          <input 
            type="checkbox" 
            id="disable-animation"
            checked={disableAnimation}
            onChange={toggleCloudAnimation}
          />
          <label htmlFor="disable-animation">Disable Cloud Animation</label>
        </div>
      )}
    </div>
  )
}

export default MenuTab
