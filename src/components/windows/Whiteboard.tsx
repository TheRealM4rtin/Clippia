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
  NodeProps,
  OnMoveEnd,
  NodeChange,
  EdgeChange,
  Connection,
  Viewport
} from '@xyflow/react'
import '@xyflow/react/dist/style.css';
import debounce from 'lodash/debounce'

import { useAppStore } from '@/lib/store'
import TextWindow from './TextWindow'
import MyComputerWindow from '@/components/panel/windows/MyComputerWindow'
import Panel from '@/components/panel/Panel'
import styles from './whiteboard.module.css'
import FeedbackWindow from '@/components/panel/windows/FeedbackWindow';
import LoginWindow from '@/components/panel/windows/LoginWindow';
import ImageNode from '@/components/nodes/ImageNode'
import Assistant3DNode from '@/components/nodes/Assistant3DNode'
import animations from '@/styles/animations.module.css'
import { NodeData, NodeTypes } from '@/types/window'
import SelectPlansWindow from '@/components/panel/windows/SelectPlansWindow'

// Define node types with correct keys matching the window types
const nodeTypes: NodeTypes = {
  text: TextWindow as ComponentType<NodeProps<NodeData>>,
  myComputer: MyComputerWindow as ComponentType<NodeProps<NodeData>>,
  feedback: FeedbackWindow as ComponentType<NodeProps<NodeData>>,
  login: LoginWindow as ComponentType<NodeProps<NodeData>>,
  image: ImageNode as ComponentType<NodeProps<NodeData>>,
  assistant3D: Assistant3DNode as ComponentType<NodeProps<NodeData>>,
  plans: SelectPlansWindow as ComponentType<NodeProps<NodeData>>
};

// Create a separate component for the Flow content
const FlowContent = memo(() => {
  const { 
    flow: { nodes, edges, viewport },
    ui: { colorBackground, backgroundColor },
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    setViewportSize,
    setViewport
  } = useAppStore();

  // Track viewport updates
  const lastViewportUpdate = useRef(Date.now());
  const viewportUpdateThreshold = 32; // ~30fps for viewport updates

  // Batch node updates
  const nodeUpdateQueue = useRef<NodeChange[]>([]);
  const edgeUpdateQueue = useRef<EdgeChange[]>([]);
  const isProcessingUpdates = useRef(false);

  // Add Assistant3D node on mount - with proper cleanup
  useEffect(() => {
    const assistant3DExists = nodes.some(node => node.type === 'assistant3D');
    if (!assistant3DExists) {
      const newNode = {
        id: 'assistant3D-' + Date.now(),
        type: 'assistant3D',
        position: { x: window.innerWidth * 0.8, y: window.innerHeight * 0.2 },
        data: {
          id: 'assistant3D',
          type: 'assistant3D',
          title: 'Assistant',
          content: '',
          position: { x: window.innerWidth * 0.8, y: window.innerHeight * 0.2 },
          zIndex: 999999
        }
      };
      
      nodeUpdateQueue.current.push({
        type: 'add',
        item: newNode
      });
      processNodeUpdates();
    }
  }, [nodes]);

  // Process batched node updates
  const processNodeUpdates = useCallback(() => {
    if (isProcessingUpdates.current || nodeUpdateQueue.current.length === 0) return;
    
    isProcessingUpdates.current = true;
    const updates = [...nodeUpdateQueue.current];
    nodeUpdateQueue.current = [];

    requestAnimationFrame(() => {
      onNodesChange(updates);
      isProcessingUpdates.current = false;
      
      if (nodeUpdateQueue.current.length > 0) {
        processNodeUpdates();
      }
    });
  }, [onNodesChange]);

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
  const handleMoveEnd = useCallback((event: React.MouseEvent | TouchEvent | null, newViewport: Viewport) => {
    const now = Date.now();
    if (now - lastViewportUpdate.current >= viewportUpdateThreshold) {
      lastViewportUpdate.current = now;
      requestAnimationFrame(() => {
        setViewport(newViewport);
      });
    }
  }, [setViewport]);

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

  const memoizedNodes = useMemo(() => nodes, [nodes]);
  const memoizedEdges = useMemo(() => edges, [edges]);

  return (
    <div 
      id="whiteboard-container" 
      style={{ 
        width: '100%', 
        height: '100vh',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
        overflow: 'hidden', // Prevent scrollbars during edge scrolling
        position: 'relative' // Ensure proper stacking context
      }}
      onMouseMove={handleEdgeScroll}
    >
      <Flow
        className={styles.whiteboardFlow}
        nodes={memoizedNodes}
        edges={memoizedEdges}
        onNodesChange={memoizedOnNodesChange}
        onEdgesChange={memoizedOnEdgesChange}
        onConnect={memoizedOnConnect}
        onMoveEnd={handleMoveEnd as OnMoveEnd}
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
        snapToGrid={true} // Add grid snapping for smoother movement
        snapGrid={[10, 10]} // 10px grid for smooth snapping
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent',
          touchAction: 'none',
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          contain: 'paint layout size' // Optimize paint and layout
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
}, () => {
  return false;
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
                  type: 'myComputer',
                  dragging: false,
                  zIndex: window.zIndex || 0,
                  position: window.position || { x: 0, y: 0 }
                }}
                width={window.size?.width || 300}
                height={window.size?.height || 200}
                sourcePosition={Position.Right}
                targetPosition={Position.Left}
                selected={false}
                dragHandle=".window-header"
                selectable={true}
                draggable={true}
                deletable={true}
                parentId={undefined}
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
