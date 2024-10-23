import React, { useState } from 'react'
import Feedback from '@/components/Feedback'
import MenuTab from '@/components/tabs/MenuTab'
import LoginTab from '@/components/tabs/LoginTab'
import MyComputerWindow from './MyComputerWindow'

import { Button } from '@react95/core';
import { Bookmark, Computer, Explore } from '@react95/icons';

interface PanelProps {
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
  colorBackground: boolean
  toggleColorBackground: () => void
}

const Panel: React.FC<PanelProps> = ({ 
  windowCount, x, y, scale, onAddWindow, onResetView,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cloudBackground,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toggleCloudBackground,
  disableAnimation,
  toggleCloudAnimation,
  colorBackground,
  toggleColorBackground
}) => {
  const [activeTab, setActiveTab] = useState('menu');

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '1px 7px',
    cursor: 'pointer',
    backgroundColor: isActive ? 'white' : '#D4D0C8',
    border: '1px solid #0054E3',
    borderBottom: isActive ? 'none' : '1px solid #0054E3',
    borderTopLeftRadius: '3px',
    borderTopRightRadius: '3px',
    marginRight: '-1px',
    position: 'relative',
    top: isActive ? '1px' : '0',
    zIndex: isActive ? 2 : 1,
    fontFamily: '"Pixelated MS Sans Serif", Arial',
    fontSize: '11px',
    fontWeight: 'normal',
    color: 'black',
  });

  const panelStyle: React.CSSProperties = {
    fontFamily: '"Pixelated MS Sans Serif", Arial',
    width: '250px',
    boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)',
    backgroundColor: '#D4D0C8',
    borderBottom: '1px solid #0054E3',
    pointerEvents: 'auto',  // Correctly typed as a string
    zIndex: 1000,  // Correctly typed as a number
  };

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
          disableAnimation={disableAnimation}
          toggleCloudAnimation={toggleCloudAnimation}
        />;
      case 'feedback':
        return <Feedback />;
      case 'login':
        return <LoginTab />;
      default:
        return null;
    }
  };

  const handleTabClick = (tab: string) => (event: React.MouseEvent) => {
    console.log(`Tab ${tab} clicked`);  // Debugging line
    event.preventDefault();
    setActiveTab(tab);
  };

  return (
    <>
    <div className="panel" style={panelStyle}>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        {['menu', 'feedback', 'login'].map((tab) => (
          <div 
            key={tab}
            style={tabStyle(activeTab === tab)}
            onClick={handleTabClick(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </div>
        ))}
      </div>
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #0054E3',
        padding: '6px',
        fontSize: '11px',
        color: 'black',
      }}>
        {renderActiveTab()}
      </div>

    </div>

    {/* <div
      className="absolute left-0 top-1/2 transform -translate-y-1/2 flex flex-col items-center gap-1 hover:underline hover:underline-offset-4"
      onClick={handleComputerIconClick}
    >
      <Computer className="w-6 h-6" />
      <span>My Computer</span>
    </div>

    {isMyComputerOpen && (
      <MyComputerWindow
        position={[0, 0, 0]}
        zIndex={1000}
        onClose={handleCloseMyComputer}
        onMinimize={() => {}}
        onMaximize={() => {}}
        scale={1}
        width={300}
        height={200}
      />
    )} */}

    </>
    
    

  );
};

export default Panel
