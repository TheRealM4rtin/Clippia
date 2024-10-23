import React from 'react'
import ButtonPanel from '@/components/ButtonPanel'
import { Computer } from '@react95/icons';
import styles from './MenuTab.module.css'

interface MenuTabProps {
  windowCount: number
  x: number
  y: number
  scale: number
  onAddWindow: () => void
  onResetView: () => void
  colorBackground: boolean
  toggleColorBackground: () => void
  openComputerWindow: () => void;
  width: number;
}

const MenuTab: React.FC<MenuTabProps> = ({ 
  windowCount, x, y, scale, onAddWindow, onResetView,
  colorBackground, toggleColorBackground,
  openComputerWindow,
  width
}) => {
  const handleButtonClick = (action: () => void) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    action();
  };

  return (
    <div className={styles.menuTab} style={{ width: width - 12 }}>
      <div className={styles.section}>
        <div className={styles.computerIcon} onClick={openComputerWindow}>
          <Computer className={styles.icon} />
          <span>My Computer</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
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

      <div className={styles.divider} />

      <div className={styles.section}>
        <p>Color Background:</p>
        <div className={styles.fieldRow}>
          <input 
            id="radio-color-yes" 
            type="radio" 
            name="color-background"
            checked={colorBackground}
            onChange={() => toggleColorBackground()}
          />
          <label htmlFor="radio-color-yes">Yes</label>
        </div>
        <div className={styles.fieldRow}>
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
    </div>
  )
}

export default MenuTab
