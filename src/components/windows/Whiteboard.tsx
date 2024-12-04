import React, { useEffect, useCallback, ComponentType, memo, useMemo } from 'react'
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
  OnMoveEnd
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

// Define node types with correct keys matching the window types
const nodeTypes: NodeTypes = {
  text: TextWindow as ComponentType<NodeProps<NodeData>>,
  myComputer: MyComputerWindow as ComponentType<NodeProps<NodeData>>,
  feedback: FeedbackWindow as ComponentType<NodeProps<NodeData>>,
  login: LoginWindow as ComponentType<NodeProps<NodeData>>,
  image: ImageNode as ComponentType<NodeProps<NodeData>>,
  assistant3D: Assistant3DNode as ComponentType<NodeProps<NodeData>>
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
      
      onNodesChange([{
        type: 'add',
        item: newNode
      }]);
    }
  }, [nodes, onNodesChange]);

  // Memoize viewport update callback
  const handleMoveEnd = useCallback((event: React.MouseEvent | TouchEvent | null, newViewport: { x: number; y: number; zoom: number }) => {
    setViewport(newViewport);
  }, [setViewport]);

  // Memoize viewport size update
  const debouncedSetViewportSize = useMemo(() => 
    debounce((width: number, height: number) => {
      setViewportSize({ width, height });
    }, 100)
  , [setViewportSize]);

  // Optimize resize listener
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        debouncedSetViewportSize(width, height);
      }
    });

    const container = document.getElementById('whiteboard-container');
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [debouncedSetViewportSize]);

  return (
    <div id="whiteboard-container" style={{ width: '100%', height: '100vh' }}>
      <Flow
        className={styles.whiteboardFlow}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent',
          touchAction: 'none'
        }}
        proOptions={{ 
          hideAttribution: true,
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
