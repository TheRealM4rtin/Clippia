import React from 'react'
import ButtonPanel from '@/components/ButtonPanel'
import { Computer } from '@react95/icons';
import styles from './MenuTab.module.css'
import { useAppStore } from '@/lib/store'
import { useReactFlow } from '@xyflow/react'

interface MenuTabProps {
  width: number
}

const MenuTab: React.FC<MenuTabProps> = ({ width }) => {
  const { 
    windows, 
    nodes,
    addWindow,
    removeWindow,
    colorBackground, 
    toggleColorBackground 
  } = useAppStore();

  // Get the ReactFlow instance
  const { fitView } = useReactFlow();

  const handleOpenMyComputer = () => {
    const existingMyComputer = windows.find(w => w.type === 'myComputer');
    if (existingMyComputer) {
      // If MyComputer window exists, remove it
      removeWindow(existingMyComputer.id);
    } else {
      // If it doesn't exist, create it
      addWindow({
        title: 'My Computer',
        content: '',
        type: 'myComputer',
        zIndex: windows.length + 1,
      });
    }
  };

  const handleAddWindow = () => {
    console.log('Before adding window - Current windows:', windows);
    console.log('Before adding window - Current nodes:', nodes);
    
    addWindow({ 
      title: 'New Window', 
      content: '', 
      type: 'text', 
      position: { x: 100, y: 100 }, // Set explicit position
      size: { width: 300, height: 200 },
      zIndex: windows.length + 1 
    });

    // Log after a short delay to ensure state has updated
    setTimeout(() => {
      console.log('After adding window - Current windows:', useAppStore.getState().windows);
      console.log('After adding window - Current nodes:', useAppStore.getState().nodes);
    }, 100);
  };

  const handleFitView = () => {
    fitView({ 
      padding: 0.2,
      includeHiddenNodes: true,
      duration: 200
    });
  };

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
        <ButtonPanel>
          <ButtonPanel.Button onClick={handleAddWindow}>
            Add Window
          </ButtonPanel.Button>
          <ButtonPanel.Button onClick={handleFitView}>
            Fit View
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
  );
};

export default MenuTab;
