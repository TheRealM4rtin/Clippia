import React, { useState, useEffect } from 'react';
import ButtonPanel from '@/components/ButtonPanel';
import { Computer, Mail, User } from '@react95/icons';
import styles from './Panel.module.css';
import { useAppStore } from '@/lib/store';
import { useReactFlow } from '@xyflow/react';

const Panel: React.FC = () => {
  const [panelWidth, setPanelWidth] = useState(250);
  const { 
    windows, 
    nodes,
    addWindow,
    removeWindow,
    colorBackground, 
    toggleColorBackground 
  } = useAppStore();

  const { fitView } = useReactFlow();

  useEffect(() => {
    const handleResize = () => {
      setPanelWidth(Math.min(window.innerWidth * 0.9, 250));
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpenMyComputer = () => {
    const existingMyComputer = windows.find(w => w.type === 'myComputer');
    if (existingMyComputer) {
      removeWindow(existingMyComputer.id);
    } else {
      addWindow({
        title: 'My Computer',
        content: '',
        type: 'myComputer',
        zIndex: windows.length + 1,
      });
    }
  };

  const handleAddWindow = () => {
    addWindow({ 
      title: 'New Window', 
      content: '', 
      type: 'text', 
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
      zIndex: windows.length + 1 
    });
  };

  const handleFitView = () => {
    fitView({ 
      padding: 0.2,
      includeHiddenNodes: true,
      duration: 200
    });
  };

  const handleOpenFeedback = () => {
    const existingFeedback = windows.find(w => w.type === 'feedback');
    if (existingFeedback) {
      removeWindow(existingFeedback.id);
    } else {
      addWindow({
        title: 'Feedback.exe',
        content: '',
        type: 'feedback',
        zIndex: windows.length + 1,
      });
    }
  };

  const handleOpenLogin = () => {
    const existingLogin = windows.find(w => w.type === 'login');
    if (existingLogin) {
      removeWindow(existingLogin.id);
    } else {
      addWindow({
        title: 'Connect.exe',
        content: '',
        type: 'login',
        zIndex: windows.length + 1,
      });
    }
  };

  return (
    <div className={styles.panel} style={{ width: panelWidth }}>
      <div className={styles.section}>
        <div className={styles.computerIcon} onClick={handleOpenMyComputer}>
          <Computer className={styles.icon} />
          <span>My Computer</span>
        </div>
        <div className={styles.computerIcon} onClick={handleOpenLogin}>
          <User className={styles.icon} />
          <span>Connect</span>
        </div>
        <div className={styles.computerIcon} onClick={handleOpenFeedback}>
          <Mail className={styles.icon} />
          <span>Feedback.exe</span>
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

export default Panel;
