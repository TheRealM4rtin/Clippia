import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Node } from '@xyflow/react';
import dynamic from 'next/dynamic';
import LoadingScreen from './LoadingScreen';

// Dynamically import Three.js components with no SSR
const ThreeCanvas = dynamic(() => import('@/components/3d/ThreeCanvas'), { 
  ssr: false,
  loading: () => <LoadingScreen />,
});

interface OnboardingProps {
  onComplete: () => void;
}

const OnboardingContent: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        textAlign: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
      }}
    >
      <h1 
        style={{
          fontSize: '48px',
          marginBottom: '20px',
          // fontFamily: "'MS Sans Serif', Arial, sans-serif",
          textShadow: '0 0 10px #ffffff, 0 0 10px #ffffff',
        }}
      >
        Welcome to Clippia
      </h1>
      <p
        style={{
          fontSize: '24px',
          maxWidth: '600px',
          margin: '0 auto 40px',
          lineHeight: '1.6',
          color: '#fff',
          textShadow: '0 0 5px #00ff00',
        }}
      >
        Your next-generation whiteboard in space. Connect ideas, create windows, and explore infinite possibilities.
      </p>
      <button
        onClick={onStart}
        className="window-button"
        style={{
          fontSize: '24px',
          padding: '12px 24px',
          transform: 'scale(1)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '2px 2px 0px 0px #808080';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '1px 1px 0px 0px #808080';
        }}
        onMouseDown={e => {
          e.currentTarget.style.transform = 'scale(0.95)';
          e.currentTarget.style.boxShadow = 'inset 2px 2px 0px 0px #404040';
          e.currentTarget.style.borderColor = '#404040 #dfdfdf #dfdfdf #404040';
        }}
        onMouseUp={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '1px 1px 0px 0px #808080';
          e.currentTarget.style.borderColor = '#dfdfdf #404040 #404040 #dfdfdf';
        }}
      >
        Start Building
      </button>
    </div>
  );
};

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { onNodesChange } = useAppStore();
  const [isStarting, setIsStarting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isStarting) return;

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
        title: 'Welcome Meme.png',
        showDeleteButton: true,
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

    onComplete();
  }, [isStarting, onNodesChange, onComplete]);

  const handleStart = () => {
    setCanvasKey(prev => prev + 1);
    setIsStarting(true);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
      <ThreeCanvas key={canvasKey} />
      {!isStarting && <OnboardingContent onStart={handleStart} />}
    </div>
  );
};

export default Onboarding; 