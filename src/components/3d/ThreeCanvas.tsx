import React, { useRef, Suspense, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import Assistant3D from './Assistant3D';
import CameraController from './CameraController';
import { ErrorBoundary } from 'react-error-boundary';
import LoadingScreen from '@/components/ui/LoadingScreen';
import * as THREE from 'three';

const SpaceBackground = () => {
  return (
    <>
      <color attach="background" args={['#000']} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null}>
        <Assistant3D />
      </Suspense>
    </>
  );
};

const ErrorFallback = ({ error }: { error: Error }) => {
  console.error('Three.js Error:', error);
  return <LoadingScreen />;
};

const ThreeCanvas = () => {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mountedRef = useRef(true);

  const handleCreated = useCallback(({ gl, camera }: { gl: THREE.WebGLRenderer; camera: THREE.PerspectiveCamera | THREE.OrthographicCamera }) => {
    if (!mountedRef.current) return;
    rendererRef.current = gl;
    
    // Set initial renderer properties
    const setupRenderer = () => {
      if (!mountedRef.current) return;
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      gl.setClearColor('#000000', 0);
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
    };

    setupRenderer();
    
    // Update camera settings
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);
    if (camera instanceof THREE.PerspectiveCamera || camera instanceof THREE.OrthographicCamera) {
      camera.updateProjectionMatrix();
    }

    // Improved context loss handling
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      if (!mountedRef.current) return;
      console.warn('WebGL context lost.');
    };

    const handleContextRestored = () => {
      if (!mountedRef.current) return;
      console.log('WebGL context restored.');
      setupRenderer();
    };

    gl.domElement.addEventListener('webglcontextlost', handleContextLost);
    gl.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      if (mountedRef.current) {
        gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
        gl.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      }
    };
  }, []);

  // Cleanup renderer on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      
      // Only dispose if we have a renderer and it hasn't already lost context
      if (rendererRef.current) {
        try {
          rendererRef.current.dispose();
        } catch (error) {
          console.warn('Error disposing renderer:', error);
        }
        rendererRef.current = null;
      }
    };
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingScreen />}>
        <Canvas 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'all',
            zIndex: 2
          }}
          orthographic
          camera={{
            position: [0, 0, 10],
            zoom: 50,
            near: 1,
            far: 200
          }}
          dpr={[1, 2]}
          gl={{ 
            alpha: true, 
            antialias: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: true,
            precision: 'highp',
            depth: true,
            stencil: false,
            failIfMajorPerformanceCaveat: false,
          }}
          onCreated={handleCreated}
          shadows
          legacy={false}
        >
          <CameraController />
          <SpaceBackground />
        </Canvas>
      </Suspense>
    </ErrorBoundary>
  );
};

export default ThreeCanvas;