import React, { memo, useCallback, useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { AuthUser } from '@/types/auth';
import ButtonPanel from '@/components/ui/ButtonPanel';
import { Mail } from '@react95/icons';
import styles from './Panel.module.css';
import { useAppStore } from '@/lib/store';
import { useReactFlow } from '@xyflow/react';
import ColorPicker from '@/components/ui/ColorPicker';
import { WindowData } from '@/types/window';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/utils/supabase/client';
import UpgradeButton from './style/UpgradeButton';
import { subscriptionService } from '@/lib/services/subscription';

declare global {
  interface Window {

    selectPlan?: (variantId: string) => void;
  }
}

const supabase = createClient() as SupabaseClient<Database>;
const WINDOW_SPACING = 30;

const Panel: React.FC = memo(() => {
  const panelWidth = 250;
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading, session, hasPaidPlan: authHasPaidPlan } = useAuth();
  const typedUser = user as AuthUser | null;
  const [hasPaidPlanState, setHasPaidPlan] = useState(false);


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

  // Add useEffect to check auth and session
  useEffect(() => {
    console.log('Panel auth state:', {
      user: user?.id,
      email: user?.email,
      sessionExists: !!session,
      hasPaidPlan: hasPaidPlanState,
      loading
    });

    const checkAuth = async () => {
      if (!typedUser && !loading) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const sessionUser = currentSession?.user as AuthUser;

        console.log('Current session check:', {
          sessionExists: !!currentSession,
          sessionUser: sessionUser?.id || null,
          contextUser: user?.id || null,
          hasPaidPlan: hasPaidPlanState
        });

        if (sessionUser) {
          console.log('Session exists but no user in context, refreshing...');
          await supabase.auth.refreshSession();
        }
      }
    };
    checkAuth();
  }, [user, loading, session, hasPaidPlanState]);

  // Add useEffect to check subscription status
  useEffect(() => {
    let mounted = true;

    const checkSubscription = async () => {
      if (user?.id) {
        console.log('Checking subscription for user:', user.id);
        const hasSubscription = await subscriptionService.hasActiveSubscription(user.id);
        console.log('Subscription check result:', { hasSubscription });
        if (mounted) {
          setHasPaidPlan(hasSubscription);
        } else {
          setHasPaidPlan(false);
        }
      } else {
        console.log('No user ID available, setting hasPaidPlan to false');
        if (mounted) {
          setHasPaidPlan(false);
        }
      }
    };

    checkSubscription();

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleShowPlans = useCallback(() => {
    console.log('Show plans clicked:', {
      userExists: !!user,
      sessionExists: !!session,
      hasPaidPlan: hasPaidPlanState
    });

    if (!user || !session) {
      console.log('Missing auth requirements:', { user: !!user, session: !!session });
      setError('Please sign in to view plans');
      return;
    }

    const existingPlans = windows.find(w => w.type === 'plans');

    if (existingPlans?.id) {
      removeWindow(existingPlans.id);
      onNodesChange([{
        type: 'remove',
        id: existingPlans.id,
      }]);
    } else {
      const viewport = getViewport();
      const maxZIndex = Math.max(0, ...windows.map(w => w.zIndex || 0)) + 1;

      const centerX = (window.innerWidth / 2 - 200) / viewport.zoom - viewport.x;
      const centerY = (window.innerHeight / 2 - 150) / viewport.zoom - viewport.y;

      const newWindow = {
        id: `plans-${Date.now()}`,
        title: 'Select Plan',
        type: 'plans' as const,
        position: {
          x: centerX,
          y: centerY
        },
        size: { width: 300, height: 250 },
        zIndex: maxZIndex,
        session,
        user,
        onError: setError,
        suppressCloudPrompt: true
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
  }, [windows, removeWindow, onNodesChange, addWindow, getViewport, session, user, hasPaidPlanState]);

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
          {!hasPaidPlanState && (
            <UpgradeButton
              user={user}
              isLoading={isLoading}
              onClick={handleShowPlans}
            />
          )}
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
