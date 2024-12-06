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

const supabase = createClient();
const WINDOW_SPACING = 30;

const Panel: React.FC = memo(() => {
  const panelWidth = 250;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading, session, refreshAuth } = useAuth();
  
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

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);

    try {
        if (!session) {
            setError('Please sign in to upgrade your account');
            await refreshAuth();
            return;
        }

        if (loading) {
            setError('Please wait while we load your account details');
            return;
        }

        const userId = session.user.id;
        console.log('Starting checkout process for user:', userId);

        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ userId })
        });

        console.log('Checkout response status:', response.status);

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();
        console.log('Checkout response data:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create checkout');
        }

        const checkoutUrl = data.data?.attributes?.url;
        if (checkoutUrl) {
            console.log('Redirecting to checkout:', checkoutUrl);
            window.location.href = checkoutUrl;
        } else {
            console.error('Checkout response:', data);
            throw new Error('No checkout URL returned');
        }
    } catch (err) {
        console.error('Checkout error:', err);
        setError(err instanceof Error ? err.message : 'Failed to create checkout session');
    } finally {
        setIsLoading(false);
    }
  };

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
            onClick={handlePurchase}
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
