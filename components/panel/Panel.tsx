import React, { useState, useEffect } from 'react';
import Feedback from '@/components/panel/tabs/Feedback';
import MenuTab from '@/components/panel/tabs/MenuTab';
import LoginTab from '@/components/panel/tabs/LoginTab';
import styles from './Panel.module.css';

const Panel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('menu');
  const [panelWidth, setPanelWidth] = useState(250);

  useEffect(() => {
    const handleResize = () => {
      setPanelWidth(Math.min(window.innerWidth * 0.9, 250));
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'menu':
        return <MenuTab width={panelWidth} />;
      case 'feedback':
        return <Feedback width={panelWidth} />;
      case 'login':
        return <LoginTab width={panelWidth} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.panel} style={{ width: panelWidth }}>
      <div className={styles.tabContainer}>
        {['menu', 'feedback', 'login'].map((tab) => (
          <div 
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </div>
        ))}
      </div>
      <div className={styles.tabContent}>
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default Panel;
