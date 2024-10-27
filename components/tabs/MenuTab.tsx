import React from 'react'
import ButtonPanel from '@/components/ButtonPanel'
import { Computer } from '@react95/icons';
import styles from './MenuTab.module.css'
import { useAppStore } from '@/lib/store'

interface MenuTabProps {
  width: number
}

const MenuTab: React.FC<MenuTabProps> = ({ width }) => {
  const { windows, addWindow, updateWindow, resetView, colorBackground, toggleColorBackground, scale, position } = useAppStore()

  const handleOpenMyComputer = () => {
    console.log('Opening My Computer');
    const existingMyComputer = windows.find(w => w.type === 'myComputer')
    if (existingMyComputer) {
      console.log('Existing My Computer window found, bringing to front');
      updateWindow(existingMyComputer.id, { zIndex: Math.max(...windows.map(w => w.zIndex)) + 1 })
    } else {
      console.log('Creating new My Computer window');
      addWindow({
        title: 'My Computer',
        content: '',
        size: { width: 0.3, height: 0.3 },
        type: 'myComputer',
        zIndex: windows.length + 1,
      })
    }
  }

  return (
    <div className={styles.menuTab} style={{ width: width - 12 }}>
      <div className={styles.section}>
        <div className={styles.computerIcon} onClick={handleOpenMyComputer}>
          <Computer className={styles.icon} />
          <span>My Computer</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <p>Windows: {windows.filter(w => w.type === 'text').length}</p>
        {/* <p>Scale: {scale.toFixed(2)}</p> */}
        {/* <p>Position: ({position.x.toFixed(0)}, {position.y.toFixed(0)})</p> */}
        <ButtonPanel>
          <ButtonPanel.Button onClick={() => addWindow({ title: 'New Window', content: '', type: 'text', zIndex: windows.length + 1 })}>
            Add Window
          </ButtonPanel.Button>
          <ButtonPanel.Button onClick={resetView}>
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
            onChange={toggleColorBackground}
          />
          <label htmlFor="radio-color-yes">Yes</label>
        </div>
        <div className={styles.fieldRow}>
          <input 
            id="radio-color-no" 
            type="radio" 
            name="color-background"
            checked={!colorBackground}
            onChange={toggleColorBackground}
          />
          <label htmlFor="radio-color-no">No</label>
        </div>
      </div>
    </div>
  )
}

export default MenuTab
