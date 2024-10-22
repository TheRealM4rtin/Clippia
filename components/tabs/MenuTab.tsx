import React from 'react'
import ButtonPanel from '@/components/ButtonPanel'

interface MenuTabProps {
  windowCount: number
  x: number
  y: number
  scale: number
  onAddWindow: () => void
  onResetView: () => void
  cloudBackground: boolean
  toggleCloudBackground: () => void
  disableAnimation: boolean
  toggleCloudAnimation: () => void
}

const MenuTab: React.FC<MenuTabProps> = ({ 
  windowCount, x, y, scale, onAddWindow, onResetView,
  cloudBackground, toggleCloudBackground, disableAnimation, toggleCloudAnimation
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
        <p>Cloud Background:</p>
        <div className="field-row">
          <input 
            id="radio-cloud-yes" 
            type="radio" 
            name="cloud-background"
            checked={cloudBackground}
            onChange={() => toggleCloudBackground()}
          />
          <label htmlFor="radio-cloud-yes">Yes</label>
        </div>
        <div className="field-row">
          <input 
            id="radio-cloud-no" 
            type="radio" 
            name="cloud-background"
            checked={!cloudBackground}
            onChange={() => toggleCloudBackground()}
          />
          <label htmlFor="radio-cloud-no">No</label>
        </div>
      </div>
      {cloudBackground && (
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
