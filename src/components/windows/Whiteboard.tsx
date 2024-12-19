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
import { v4 as uuidv4 } from 'uuid';

import { useAppStore } from '@/lib/store'
import { useWhiteboardState } from '@/lib/hooks/useWhiteboardState'
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
import { SaveError, WhiteboardNode, WhiteboardNodeProps } from '@/types/whiteboard'
import { isMyComputerProps } from '@/types/components';
import { PlansWindowData } from '@/types/window';

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
    subscription_status: 'inactive',
    subscription_tier: 'basic',
    subscription_updated_at: new Date().toISOString()
  };

  const plansData: PlansWindowData = {
    ...props.data,
    session,
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
    ui: { colorBackground, backgroundColor },
    onNodesChange,
    onEdgesChange,
    onConnect,
    setViewportSize,
    setViewport
  } = useAppStore();

  // Initialize whiteboard state management
  const whiteboardId = useMemo(() => uuidv4(), []); // TODO: Get from URL or props
  const {
    loadState,
    queueSave,
    isLoading,
    error,
    hasCloudAccess,
    setError
  } = useWhiteboardState(
    session?.user?.id || '',
    whiteboardId
  );

  // Only show upgrade prompt if user is logged in, has an error, and doesn't have cloud access
  const shouldShowUpgradePrompt = useMemo(() => {
    return session?.user &&
      error?.data?.type === 'subscription_required' &&
      !hasCloudAccess &&
      !error?.data?.suppressPrompt;
  }, [session?.user, error?.data, hasCloudAccess]);

  // Handle upgrade click
  const handleUpgrade = useCallback(() => {
    setError(null);

    const newNode: WhiteboardNode = {
      id: 'plans-' + Date.now(),
      type: 'plans',
      position: { x: window.innerWidth * 0.5 - 200, y: window.innerHeight * 0.5 - 200 },
      data: {
        id: 'plans-' + Date.now(),
        title: 'Upgrade Plans',
        content: '',
        position: { x: window.innerWidth * 0.5 - 200, y: window.innerHeight * 0.5 - 200 },
        zIndex: 999999,
        windowType: 'plans' as const,
        suppressCloudPrompt: true
      }
    };

    onNodesChange([{ type: 'add', item: newNode }]);
  }, [onNodesChange, setError]);

  // Handle close of upgrade prompt
  const handleCloseUpgrade = useCallback(() => {
    if (error) {
      setError({
        message: error.message || 'Unknown error',
        data: {
          ...(error.data || {}),
          suppressPrompt: true
        },
        retryable: error.retryable || false
      });
    } else {
      setError(null);
    }
  }, [setError, error]);

  // Load or create initial state
  useEffect(() => {
    if (session?.user?.id) {
      loadState().then(state => {
        if (state) {
          // Update store with loaded/created state
          if (state.nodes.length > 0) {
            state.nodes.forEach(node => onNodesChange([{ type: 'add', item: node }]));
          }
          if (state.edges.length > 0) {
            state.edges.forEach(edge => onEdgesChange([{ type: 'add', item: edge }]));
          }
          setViewport(state.viewport);
        }
      });
    }
  }, [session?.user?.id, loadState, onNodesChange, onEdgesChange, setViewport]);

  // Track viewport updates with debouncing
  const lastViewportUpdate = useRef(Date.now());
  const viewportUpdateThreshold = 32; // ~30fps for viewport updates

  // Batch node updates with save queue integration
  const nodeUpdateQueue = useRef<NodeChange[]>([]);
  const edgeUpdateQueue = useRef<EdgeChange[]>([]);
  const isProcessingUpdates = useRef(false);

  // Process batched node updates and trigger save
  const processNodeUpdates = useCallback(() => {
    if (isProcessingUpdates.current || nodeUpdateQueue.current.length === 0) return;

    isProcessingUpdates.current = true;
    const updates = [...nodeUpdateQueue.current];
    nodeUpdateQueue.current = [];

    requestAnimationFrame(() => {
      onNodesChange(updates);
      isProcessingUpdates.current = false;

      // Queue save after node updates
      if (session?.user?.id) {
        queueSave({
          id: whiteboardId,
          user_id: session.user.id,
          name: 'My Whiteboard', // TODO: Make configurable
          nodes: nodes as WhiteboardNode[],
          edges,
          viewport,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (nodeUpdateQueue.current.length > 0) {
        processNodeUpdates();
      }
    });
  }, [onNodesChange, nodes, edges, viewport, session?.user?.id, whiteboardId, queueSave]);

  // Add Assistant3D node on mount - with proper cleanup
  const createAssistant3DNode = (): WhiteboardNode => ({
    id: 'assistant3D-' + Date.now(),
    type: 'assistant3D',
    position: { x: window.innerWidth * 0.8, y: window.innerHeight * 0.2 },
    data: {
      id: 'assistant3D-' + Date.now(),
      title: 'Assistant',
      content: '',
      position: { x: window.innerWidth * 0.8, y: window.innerHeight * 0.2 },
      zIndex: 999999,
      windowType: 'assistant3D'
    }
  });

  useEffect(() => {
    const assistant3DExists = nodes.some(node => node.type === 'assistant3D');
    if (!assistant3DExists) {
      const newNode = createAssistant3DNode();
      nodeUpdateQueue.current.push({
        type: 'add',
        item: newNode
      });
      processNodeUpdates();
    }
  }, [nodes, processNodeUpdates]);

  // Process batched edge updates
  const processEdgeUpdates = useCallback(() => {
    if (edgeUpdateQueue.current.length === 0) return;

    const updates = [...edgeUpdateQueue.current];
    edgeUpdateQueue.current = [];

    requestAnimationFrame(() => {
      onEdgesChange(updates);
    });
  }, [onEdgesChange]);

  // Optimized handlers with batching
  const memoizedOnNodesChange = useCallback((changes: NodeChange[]) => {
    nodeUpdateQueue.current.push(...changes);
    processNodeUpdates();
  }, [processNodeUpdates]);

  const memoizedOnEdgesChange = useCallback((changes: EdgeChange[]) => {
    edgeUpdateQueue.current.push(...changes);
    processEdgeUpdates();
  }, [processEdgeUpdates]);

  const memoizedOnConnect = useCallback((connection: Connection) => {
    requestAnimationFrame(() => {
      onConnect(connection);
    });
  }, [onConnect]);

  // Optimized viewport update with throttling
  const handleMoveEnd = useCallback((
    event: React.MouseEvent<Element, MouseEvent> | TouchEvent | null,
    newViewport: Viewport
  ) => {
    const now = Date.now();
    if (now - lastViewportUpdate.current >= viewportUpdateThreshold) {
      lastViewportUpdate.current = now;
      requestAnimationFrame(() => {
        setViewport(newViewport);
        if (session?.user?.id) {
          queueSave({
            id: whiteboardId,
            user_id: session.user.id,
            name: 'My Whiteboard',
            nodes: nodes as WhiteboardNode[],
            edges,
            viewport: newViewport,
            version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      });
    }
  }, [setViewport, nodes, edges, session?.user?.id, whiteboardId, queueSave]);

  // Optimized edge scrolling
  const handleEdgeScroll = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;
    const edgeThreshold = 50;
    const scrollSpeed = 15;

    if (clientX < edgeThreshold || clientX > innerWidth - edgeThreshold ||
      clientY < edgeThreshold || clientY > innerHeight - edgeThreshold) {

      const dx = clientX < edgeThreshold ? -scrollSpeed :
        clientX > innerWidth - edgeThreshold ? scrollSpeed : 0;
      const dy = clientY < edgeThreshold ? -scrollSpeed :
        clientY > innerHeight - edgeThreshold ? scrollSpeed : 0;

      requestAnimationFrame(() => {
        setViewport({
          x: viewport.x + dx,
          y: viewport.y + dy,
          zoom: viewport.zoom
        });
      });
    }
  }, [setViewport, viewport]);

  // Optimize viewport size updates
  const debouncedSetViewportSize = useMemo(() =>
    debounce((width: number, height: number) => {
      requestAnimationFrame(() => {
        setViewportSize({ width, height });
      });
    }, 400) // Increased debounce time for better performance
    , [setViewportSize]);

  // Optimized resize observer with throttling
  useEffect(() => {
    let rafId: number;
    let lastUpdate = 0;
    const updateThreshold = 32; // ~30fps

    const resizeObserver = new ResizeObserver((entries) => {
      const now = Date.now();
      if (now - lastUpdate >= updateThreshold) {
        lastUpdate = now;

        if (rafId) {
          cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            debouncedSetViewportSize(width, height);
          }
        });
      }
    });

    const container = document.getElementById('whiteboard-container');
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver.disconnect();
    };
  }, [debouncedSetViewportSize]);

  
  

  return (
    <div
      id="whiteboard-container"
      style={{
        width: '100%',
        height: '100vh',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
        overflow: 'hidden',
        position: 'relative'
      }}
      onMouseMove={handleEdgeScroll}
    >
      {isLoading && session?.user && (
        <div className={styles.loadingOverlay}>
          {nodes.length === 0 ? "Creating new whiteboard..." : "Loading whiteboard..."}
        </div>
      )}
      {shouldShowUpgradePrompt && (
        <CloudStoragePrompt
          onUpgrade={handleUpgrade}
          onClose={() => {
            handleCloseUpgrade();
            // Add flag to prevent showing prompt again this session
            setError({
              message: error?.message || 'Unknown error',
              data: {
                ...(error?.data || {}),
                suppressPrompt: true
              },
              retryable: error?.retryable
            } as SaveError);
          }}
        />
      )}
      {error && error?.data?.type !== 'subscription_required' && (
        <div className={styles.errorOverlay}>
          {error.message}
          {error.retryable && (
            <button onClick={() => loadState()}>
              Retry
            </button>
          )}
        </div>
      )}
      <Flow
        className={styles.whiteboardFlow}
        nodes={nodes as WhiteboardNode[]}
        edges={edges}
        onNodesChange={memoizedOnNodesChange}
        onEdgesChange={memoizedOnEdgesChange}
        onConnect={memoizedOnConnect}
        onMoveEnd={handleMoveEnd}
        nodeTypes={nodeTypes}
        fitView={false}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={viewport}
        panOnDrag={true}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        selectionMode={SelectionMode.Full}
        selectNodesOnDrag={false}
        deleteKeyCode="Backspace"
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Control"
        elevateNodesOnSelect={true}
        nodesDraggable={true}
        nodesConnectable={true}
        nodesFocusable={true}
        edgesFocusable={true}
        elementsSelectable={true}
        preventScrolling={true}
        snapToGrid={true}
        snapGrid={[10, 10]}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
          touchAction: 'none',
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          contain: 'paint layout size'
        }}
        proOptions={{
          hideAttribution: true,
          account: 'paid-pro'
        }}
      >
        <Background
          color={colorBackground ? backgroundColor || '#ffffffff' : '#00000000'}
          variant={BackgroundVariant.Lines}
          gap={0}
        />
        <FlowPanel position="top-left">
          <div className={styles.panelContainer}>
            <Panel />
          </div>
        </FlowPanel>
        <MiniMap
          zoomable
          pannable
          position="bottom-left"
        />
      </Flow>
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
