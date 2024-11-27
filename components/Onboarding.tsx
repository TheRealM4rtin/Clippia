import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Node } from '@xyflow/react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { onNodesChange } = useAppStore();

  useEffect(() => {
    // Add welcome window node
    const welcomeNode: Node = {
      id: 'welcome-window',
      type: 'text',
      position: { x: window.innerWidth / 2 - 580, y: window.innerHeight / 2 - 300 },
      data: {
        title: 'Latest boring news ',
        content: [
          "### Welcome to Clippia bro",
          "",
          "- Create your whitebored",
          "- Add draggable windows",
          "- Insert images inside windows",
          "- Connect your ideas",
          "",
          "Try dragging this window around, or play with chill bro!"
        ].join('\n'),
      },
    };

    // Add meme image node
    const memeNode: Node = {
      id: 'welcome-meme',
      type: 'image',
      position: { x: window.innerWidth * 0.6, y: window.innerHeight * 0.3 },
      data: {
        src: '/memes/welcome_meme.png',
        alt: 'Welcome meme',
        width: 200,
        height: 200,
      },
      connectable: false,
    };

    // Add all nodes using onNodesChange
    onNodesChange([
      {
        type: 'add',
        item: welcomeNode,
      },
      {
        type: 'add',
        item: memeNode,
      },
    ]);

    // Set up event listener for clear button
    const handleClear = () => {
      // Remove all onboarding nodes when clearing
      onNodesChange([
        { type: 'remove', id: 'welcome-window' },
        { type: 'remove', id: 'welcome-meme' },
      ]);
      onComplete();
    };

    window.addEventListener('clearOnboarding', handleClear);

    return () => {
      window.removeEventListener('clearOnboarding', handleClear);
    };
  }, [onNodesChange, onComplete]);

  return (
    <div 
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        textAlign: 'center',
        width: '100%',
        pointerEvents: 'auto',
      }}
    >
      <div 
        style={{
          fontSize: '24px',
          color: '#333',
          marginBottom: '20px',
          fontFamily: "'MS Sans Serif', Arial, sans-serif",
          textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
          userSelect: 'none',
        }}
      >
        Welcome to your new favorite whiteboard!
      </div>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('clearOnboarding'))}
        className="window-button"
        style={{
          fontSize: '16px',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        Start Building
      </button>
    </div>
  );
};

export default Onboarding; 