import React, { Suspense, useRef, useEffect, useCallback, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Canvas } from '@react-three/fiber';
import Assistant3D from '@/components/3d/Assistant3D';
import { ErrorBoundary } from 'react-error-boundary';
import LoadingScreen from '@/components/ui/LoadingScreen';
import * as THREE from 'three';
import { useAppStore } from '@/lib/store';
import styles from '@/styles/animations.module.css';

const Assistant3DNode: React.FC<NodeProps> = memo(({ id }) => {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mountedRef = useRef(false);
  const { windows: { windows }, addWindow, removeWindow, flow: { viewport }, onNodesChange } = useAppStore();

  // Function to update node position to follow viewport
  const updateNodePosition = useCallback(() => {
    // Calculate position in viewport coordinates
    const viewportWidth = window.innerWidth / viewport.zoom;
    const viewportHeight = window.innerHeight / viewport.zoom;
    const targetX = -viewport.x + viewportWidth * 0.8;
    const targetY = -viewport.y + viewportHeight * 0.2;

    onNodesChange([{
      id,
      type: 'position',
      position: { x: targetX, y: targetY }
    }]);
  }, [viewport.x, viewport.y, viewport.zoom, id, onNodesChange]);

  // Update position when viewport changes
  useEffect(() => {
    updateNodePosition();
  }, [updateNodePosition]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const existingMyComputer = windows.find(w => w.type === 'myComputer');
    if (existingMyComputer?.id) {
      removeWindow(existingMyComputer.id);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      addWindow({
        id: `myComputer-${Date.now()}`,
        title: 'My Computer',
        content: '',
        type: 'myComputer',
        position: {
          x: rect.left + rect.width + 10,
          y: rect.top
        },
        size: { width: 300, height: 400 },
        zIndex: Math.min(Math.max(...windows.map(w => w.zIndex || 0)) + 1, 999999),
      });
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      className={`${styles.windowHoverEffect} ${styles.strong}`}
      style={{ 
        width: 150, 
        height: 150,
        background: 'transparent',
        borderRadius: '8px',
        pointerEvents: 'all',
        cursor: 'pointer',
        position: 'relative',
        zIndex: 999
      }}
      onClick={handleClick}
    >
      {mountedRef.current && (
        <ErrorBoundary FallbackComponent={LoadingScreen}>
          <Suspense fallback={<LoadingScreen />}>
            <Canvas
              orthographic
              camera={{
                position: [0, 0, 10],
                zoom: 50,
                near: 1,
                far: 200
              }}
              style={{ 
                width: '100%', 
                height: '100%',
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 1
              }}
              dpr={1}
              gl={{ 
                alpha: true, 
                antialias: false,
                powerPreference: 'default',
                preserveDrawingBuffer: false,
              }}
              onCreated={({ gl }) => {
                rendererRef.current = gl;
                gl.setPixelRatio(1);
                gl.setClearColor('#000000', 0);
              }}
            >
              <Assistant3D />
              <ambientLight intensity={0.8} />
              <pointLight position={[10, 10, 10]} intensity={0.5} />
            </Canvas>
          </Suspense>
        </ErrorBoundary>
      )}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ visibility: 'hidden' }} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ visibility: 'hidden' }} 
      />
    </div>
  );
});

Assistant3DNode.displayName = 'Assistant3DNode';

export default Assistant3DNode;