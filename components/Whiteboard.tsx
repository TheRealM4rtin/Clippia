import React, { useEffect, useCallback } from 'react'
import { 
  ReactFlow as Flow,
  MiniMap,
  Background,
  useReactFlow,
  Panel as FlowPanel,
  ReactFlowProvider,
  SelectionMode
} from '@xyflow/react'
import '@xyflow/react/dist/style.css';

import { useAppStore } from '@/lib/store'
import TextWindow from './TextWindow'
import MyComputerWindow from './panel/windows/MyComputerWindow'
import Panel from './panel/Panel'
import styles from './whiteboard.module.css'  // Make sure to import the styles
import FeedbackWindow from './panel/windows/FeedbackWindow';
import LoginWindow from './panel/windows/LoginWindow';

// Define node types with correct keys matching the window types
const nodeTypes = {
  text: TextWindow,
  myComputer: MyComputerWindow,
  feedback: FeedbackWindow,
  login: LoginWindow
} as const;

// Create a separate component for the Flow content
const FlowContent = () => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    colorBackground,
    setViewportSize
  } = useAppStore();

  const reactFlowInstance = useReactFlow();

  // Update viewport size on mount and resize
  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, [setViewportSize]);

  // Handle viewport changes
  const onMoveEnd = useCallback(() => {
    const { x, y, zoom } = reactFlowInstance.getViewport();
    useAppStore.getState().setViewport({ x, y, zoom });
  }, [reactFlowInstance]);

  return (
    <Flow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onMoveEnd={onMoveEnd}
      nodeTypes={nodeTypes}
      fitView={false}
      minZoom={0.1}
      maxZoom={1.5}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      panOnDrag={[0]}
      panOnScroll={false}
      zoomOnScroll={true}
      zoomOnPinch={true}
      selectionMode={SelectionMode.Full}
      selectNodesOnDrag={false}
      style={{ 
        width: '100%', 
        height: '100vh',
        background: 'transparent',
      }}
      proOptions={{ 
        hideAttribution: true,
      }}
      fitViewOptions={{
        padding: 0.2,
        includeHiddenNodes: true,
        duration: 200
      }}
    >
      
      <MiniMap 
        zoomable 
        pannable
        position="bottom-left"
      />
      <Background 
        color={colorBackground ? '#ffffff10' : '#00000010'}
      />
      <FlowPanel position="top-left">
        <div className={styles.panelContainer}>
          <Panel />
        </div>
      </FlowPanel>
    </Flow>
  );
};

// Main Whiteboard component
const Whiteboard: React.FC = () => {
  const { colorBackground } = useAppStore();

  return (
    <main className={styles.whiteboard}>
      <div className={colorBackground ? styles.colorBackground : styles.cloudBackground} />
      <div className={styles.canvasContainer}>
        <ReactFlowProvider>
          <FlowContent />
        </ReactFlowProvider>
      </div>
    </main>
  );
};

export default Whiteboard;
