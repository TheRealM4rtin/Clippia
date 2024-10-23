import React, { useState, useCallback, useEffect } from 'react'
import Feedback from '@/components/tabs/Feedback'
import MenuTab from '@/components/tabs/MenuTab'
import LoginTab from '@/components/tabs/LoginTab'
import styles from './Panel.module.css'

import { Bookmark, Explore } from '@react95/icons';
import * as THREE from 'three';

import { Button } from '@react95/core';

interface PanelProps {
  windowCount: number
  x: number
  y: number
  scale: number
  onAddWindow: () => void
  onResetView: () => void
  colorBackground: boolean
  toggleColorBackground: () => void
  updateCursorStyle: (style: string) => void
  createTextWindow: (title: string, content: string, readOnly?: boolean) => void
  camera?: THREE.Camera;
  size: { width: number; height: number };
  openComputerWindow: () => void;
}

const Panel: React.FC<PanelProps> = ({ 
  windowCount, x, y, scale, onAddWindow, onResetView,
  colorBackground, toggleColorBackground,
  updateCursorStyle, createTextWindow, camera, size,
  openComputerWindow
}) => {
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
        return <MenuTab 
          windowCount={windowCount} 
          x={x} 
          y={y} 
          scale={scale} 
          onAddWindow={onAddWindow} 
          onResetView={onResetView}
          colorBackground={colorBackground}
          toggleColorBackground={toggleColorBackground}
          openComputerWindow={openComputerWindow}
          width={panelWidth}
        />;
      case 'feedback':
        return <Feedback width={panelWidth} />;
      case 'login':
        return <LoginTab width={panelWidth} />;
      default:
        return null;
    }
  };

  const handleTabClick = (tab: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    setActiveTab(tab);
  };

  return (
    <div className={styles.panel} style={{ width: panelWidth }}>
      <div className={styles.tabContainer}>
        {['menu', 'feedback', 'login'].map((tab) => (
          <div 
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
            onClick={handleTabClick(tab)}
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

export default Panel
