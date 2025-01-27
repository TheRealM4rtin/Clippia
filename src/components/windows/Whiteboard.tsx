import React, { useEffect, useCallback, ComponentType, memo, useMemo, useRef } from 'react'
import {
  ReactFlow as Flow,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel as FlowPanel,
  ReactFlowProvider,
  SelectionMode,
  Position,
  NodeChange,
  EdgeChange,
  Connection,
  Viewport,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css';
import debounce from 'lodash/debounce'

import { useAppStore } from '@/lib/store'
import { useAuth } from '@/contexts/AuthContext'
import TextWindow from './TextWindow'
import MyComputerWindow from '@/components/panel/windows/MyComputerWindow'
import Panel from '@/components/panel/Panel'
import styles from './whiteboard.module.css'
import FeedbackWindow from '@/components/panel/windows/FeedbackWindow';
import LoginWindow from '@/components/panel/windows/LoginWindow';
import ImageNode from '@/components/nodes/ImageNode'
import Assistant3DNode from '@/components/nodes/Assistant3DNode'
import animations from '@/styles/animations.module.css'
import { WindowType } from '@/types/window'
import { SelectPlansWindow } from '@/components/panel/windows/SelectPlansWindow'
import { WhiteboardNode, WhiteboardNodeProps, WhiteboardState, WhiteboardNodeData } from '@/types/whiteboard'
import { isMyComputerProps } from '@/types/components';
import { PlansWindowData } from '@/types/window';
import { Session } from '@supabase/supabase-js';
import { useWhiteboardManager } from '@/lib/hooks/useWhiteboardManager'

// Update nodeTypes definition
const MyComputerNode = memo((props: WhiteboardNodeProps) => {
  if (isMyComputerProps(props)) {
    return <MyComputerWindow {...props} />;
  }
  return null;
});
MyComputerNode.displayName = 'MyComputerNode';

const TextNode = memo((props: WhiteboardNodeProps) => <TextWindow {...props} />);
TextNode.displayName = 'TextNode';

const FeedbackNode = memo((props: WhiteboardNodeProps) => <FeedbackWindow {...props} />);
FeedbackNode.displayName = 'FeedbackNode';

const LoginNode = memo((props: WhiteboardNodeProps) => <LoginWindow {...props} />);
LoginNode.displayName = 'LoginNode';

const ImageNodeWrapper = memo((props: WhiteboardNodeProps) => <ImageNode {...props} />);
ImageNodeWrapper.displayName = 'ImageNodeWrapper';

const Assistant3DNodeWrapper = memo((props: WhiteboardNodeProps) => <Assistant3DNode {...props} />);
Assistant3DNodeWrapper.displayName = 'Assistant3DNodeWrapper';

const PlansWindowWrapper = memo((props: WhiteboardNodeProps) => {
  const { session, user } = useAuth();
  const handleError = useCallback((error: string) => {
    console.error('Plans window error:', error);
  }, []);

  if (!session || !user) {
    return null;
  }

  const authUser = {
    ...user,
    email: user.email || null,
    customer_id: '',
    subscription_id: '',
    subscription_status: 'inactive' as const,
    subscription_tier: 'basic' as const,
    subscription_updated_at: new Date().toISOString(),
    updated_at: user.updated_at || null
  };

  const plansData: PlansWindowData = {
    ...props.data,
    session: session as Session,
    user: authUser,
    onError: handleError,
    zIndex: props.data.zIndex || 0,
    windowType: 'plans'
  };

  return <SelectPlansWindow {...props} data={plansData} />;
});

PlansWindowWrapper.displayName = 'PlansWindowWrapper';

const nodeTypes: Record<WindowType, ComponentType<WhiteboardNodeProps>> = {
  myComputer: MyComputerNode,
  text: TextNode,
  feedback: FeedbackNode,
  login: LoginNode,
  image: ImageNodeWrapper,
  assistant3D: Assistant3DNodeWrapper,
  plans: PlansWindowWrapper
};

// Add this component for the upgrade prompt
const CloudStoragePrompt: React.FC<{ onUpgrade: () => void, onClose: () => void }> = ({ onUpgrade, onClose }) => (
  <div className={styles.upgradePrompt}>
    <h3>Enable Cloud Storage</h3>
    <p>Save your work and access it from anywhere with cloud storage.</p>
    <div className={styles.upgradePromptButtons}>
      <button onClick={onUpgrade} className={styles.upgradeButton}>
        See Plans
      </button>
      <button onClick={onClose} className={styles.cancelButton}>
        No Thanks
      </button>
    </div>
  </div>
);

// Create a separate component for the Flow content
const FlowContent = memo(() => {
  const { session } = useAuth();
  const {
    flow: { nodes, edges, viewport },
    onNodesChange,
    onEdgesChange,
    onConnect,
    setViewport
  } = useAppStore();

  const {
    isLoading,
    error,
    saveWhiteboard,
    initialized
  } = useWhiteboardManager();

  // Create Assistant3D node only once after initial load
  useEffect(() => {
    if (!isLoading && nodes.length === 0 && !session?.user) {
      const assistant3DNode = {
        id: 'assistant3D-' + Date.now(),
        type: 'assistant3D' as const,
        position: { x: window.innerWidth * 0.8, y: window.innerHeight * 0.2 },
        data: {
          id: 'assistant3D-' + Date.now(),
          title: 'Assistant',
          content: '',
          position: { x: window.innerWidth * 0.8, y: window.innerHeight * 0.2 },
          zIndex: 999999,
          windowType: 'assistant3D' as const
        }
      };

      onNodesChange([{ type: 'add', item: assistant3DNode }]);
    }
  }, [isLoading, nodes.length, onNodesChange, session?.user]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);

    if (initialized && !isLoading && changes.some(c => c.type === 'position' || c.type === 'dimensions')) {
      saveWhiteboard();
    }
  }, [initialized, isLoading, saveWhiteboard, onNodesChange]);

  return (
    <div id="whiteboard-container" className={styles.whiteboardContainer}>
      {isLoading && session?.user && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            Loading your whiteboard...
            {error && <div className={styles.error}>Error: {error.message}</div>}
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className={styles.errorOverlay}>
          <div className={styles.errorContent}>
            Failed to load whiteboard: {error.message}
          </div>
        </div>
      )}

      <Flow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        defaultViewport={viewport}
        onViewportChange={(viewport) => setViewport(viewport)}
        fitView
      />
    </div>
  );
});

FlowContent.displayName = 'FlowContent';

// Main Whiteboard component
const Whiteboard: React.FC = () => {
  const { ui: { colorBackground, backgroundColor }, windows: { windows } } = useAppStore();

  return (
    <main className={`${styles.whiteboard} ${animations.whiteboard}`}>
      <div
        className={colorBackground ? styles.colorBackground : styles.cloudBackground}
        style={colorBackground ? { backgroundColor: backgroundColor } : undefined}
      />
      <div className={styles.canvasContainer}>
        <ReactFlowProvider>
          <FlowContent />
        </ReactFlowProvider>
      </div>
      <div className={styles.windowsContainer}>
        {windows.map((window) => {
          if (window.type === 'myComputer') {
            return (
              <MyComputerWindow
                key={window.id}
                id={window.id || ''}
                type="myComputer"
                dragging={false}
                zIndex={window.zIndex || 0}
                isConnectable={false}
                positionAbsoluteX={window.position?.x || 0}
                positionAbsoluteY={window.position?.y || 0}
                data={{
                  ...window,
                  type: 'myComputer' as const,
                  dragging: false,
                  zIndex: window.zIndex || 0,
                  position: window.position || { x: 0, y: 0 },
                  windowType: 'myComputer' as const
                }}
                width={window.size?.width || 300}
                height={window.size?.height || 400}
                sourcePosition={Position.Right}
                targetPosition={Position.Left}
                selected={false}
                dragHandle=".window-header"
                selectable={true}
                draggable={true}
                deletable={true}
              />
            );
          }
          return null;
        })}
      </div>
    </main>
  );
};

export default memo(Whiteboard);
