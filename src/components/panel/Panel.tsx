import React, { memo, useCallback, useState, useEffect } from 'react';
import ButtonPanel from '@/components/ui/ButtonPanel';
import { Mail } from '@react95/icons';
import styles from './Panel.module.css';
import { useAppStore } from '@/lib/store';
import { useReactFlow } from '@xyflow/react';
import ColorPicker from '@/components/ui/ColorPicker';
import { WindowData } from '@/types/window';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/utils/supabase/client';

declare global {
  interface Window {
    selectPlan: (variantId: string) => void;
  }
}

const supabase = createClient();
const WINDOW_SPACING = 30;

const Panel: React.FC = memo(() => {
  const panelWidth = 250;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading, session } = useAuth();

  const {
    flow: { nodes },
    windows: { windows },
    addWindow,
    removeWindow,
    ui: { backgroundColor },
    setBackgroundColor,
    onNodesChange
  } = useAppStore();

  const { fitView, getViewport } = useReactFlow();

  // Debug effect to log auth state changes
  useEffect(() => {
    console.log('Auth state:', { user, loading });
  }, [user, loading]);

  // Add useEffect to debug auth state changes
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      if (session && !user) {
        // Force refresh auth context if we have a session but no user
        await supabase.auth.refreshSession();
      }
    };
    checkAuth();
  }, [user]);


  const handleShowPlans = useCallback(() => {
    const existingPlans = windows.find(w => w.id === 'subscription-plans');

    if (existingPlans?.id) {
      removeWindow(existingPlans.id);
      onNodesChange([{
        type: 'remove',
        id: existingPlans.id,
      }]);
    } else {
      const viewport = getViewport();
      const maxZIndex = Math.max(0, ...windows.map(w => w.zIndex || 0)) + 1;

      const newWindow = {
        id: 'subscription-plans',
        title: 'Select Plan',
        content: '',
        type: 'plans' as const,
        position: {
          x: (window.innerWidth / 2 - 200) / viewport.zoom - viewport.x,
          y: (window.innerHeight / 2 - 150) / viewport.zoom - viewport.y
        },
        size: { width: 500, height: 400 },
        zIndex: maxZIndex,
        session: session
      };

      addWindow(newWindow);
      onNodesChange([{
        type: 'add',
        item: {
          id: newWindow.id,
          type: 'plans',
          position: newWindow.position,
          data: newWindow,
        }
      }]);
    }
  }, [windows, removeWindow, onNodesChange, addWindow, getViewport, session]);



  const handleAddWindow = useCallback(() => {
    const existingWindows = nodes.filter(n => n.type === 'text');
    const offset = existingWindows.length * WINDOW_SPACING;

    const viewport = getViewport();

    // Calculate position in viewport coordinates
    const screenX = (window.innerWidth / 2 - 150 + offset) / viewport.zoom - viewport.x;
    const screenY = (window.innerHeight / 2 - 100 + offset) / viewport.zoom - viewport.y;

    const newWindow: Partial<WindowData> = {
      id: `window-${Date.now()}`,
      title: 'New Window',
      content: '',
      type: 'text',
      position: {
        x: screenX,
        y: screenY
      },
      size: { width: 300, height: 200 },
      zIndex: Math.max(...windows.map(w => w.zIndex || 0)) + 1,
      isNew: true
    };

    // Check if window would go off screen
    const maxX = (window.innerWidth - 300) / viewport.zoom - viewport.x;
    const maxY = (window.innerHeight - 200) / viewport.zoom - viewport.y;

    if (screenX > maxX || screenY > maxY) {
      // Reset to initial position with small offset
      const resetOffset = (existingWindows.length % 3) * WINDOW_SPACING;
      newWindow.position = {
        x: (window.innerWidth / 2 - 150 + resetOffset) / viewport.zoom - viewport.x,
        y: (window.innerHeight / 2 - 100 + resetOffset) / viewport.zoom - viewport.y
      };
    }

    addWindow(newWindow);
    onNodesChange([{
      type: 'add',
      item: {
        id: newWindow.id!,
        type: 'text',
        position: newWindow.position!,
        data: newWindow,
        draggable: true,
        selectable: true
      }
    }]);
  }, [nodes, windows, addWindow, onNodesChange, getViewport]);

  const handleFitView = useCallback(() => {
    fitView({
      padding: 0.2,
      includeHiddenNodes: true,
      duration: 200
    });
  }, [fitView]);

  const handleOpenFeedback = useCallback(() => {
    const existingFeedback = windows.find(w => w.type === 'feedback');

    if (existingFeedback?.id) {
      removeWindow(existingFeedback.id);
      onNodesChange([{
        type: 'remove',
        id: existingFeedback.id,
      }]);
    } else {
      const viewport = getViewport();
      const maxZIndex = Math.max(0, ...windows.map(w => w.zIndex || 0)) + 1;

      // Calculate center position in viewport coordinates
      const centerX = (window.innerWidth / 2 - 200) / viewport.zoom - viewport.x;
      const centerY = (window.innerHeight / 2 - 150) / viewport.zoom - viewport.y;

      const newWindow = {
        id: `feedback-${Date.now()}`,
        title: 'Feedback.exe',
        content: '',
        type: 'feedback' as const,
        position: {
          x: centerX,
          y: centerY
        },
        size: { width: 400, height: 300 },
        zIndex: maxZIndex,
      };

      addWindow(newWindow);
      onNodesChange([{
        type: 'add',
        item: {
          id: newWindow.id,
          type: 'feedback',
          position: newWindow.position,
          data: newWindow,
        }
      }]);
    }
  }, [windows, removeWindow, onNodesChange, addWindow, getViewport]);

  const handleColorChange = useCallback((color: string) => {
    setBackgroundColor(color);
  }, [setBackgroundColor]);

  return (
    <div className={styles.panel} style={{ width: panelWidth }}>
      <div className={styles.section}>
        <div className={styles.computerIcon} onClick={handleOpenFeedback}>
          <Mail className={styles.icon} />
          <span>Feedback.exe</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <p>Windows: {nodes.filter(n => n.type === 'text').length}</p>
        <ButtonPanel>
          <ButtonPanel.Button onClick={handleAddWindow}>
            Add Window
          </ButtonPanel.Button>
          <ButtonPanel.Button onClick={handleFitView}>
            Fit View
          </ButtonPanel.Button>
          <ButtonPanel.Button
            onClick={handleShowPlans}
            disabled={isLoading}
            className={isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isLoading ? 'Processing...' : '✨ Upgrade Now ✨'}
          </ButtonPanel.Button>
        </ButtonPanel>
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <p>Color Background:</p>
        <ColorPicker
          selectedColor={backgroundColor || '#FFFFFF'}
          onColorChange={handleColorChange}
        />
      </div>
    </div>
  );
});

Panel.displayName = 'Panel';

export default Panel;
