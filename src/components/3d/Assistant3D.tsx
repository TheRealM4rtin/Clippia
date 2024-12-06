import React, { useRef, useState, useEffect, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, Clock } from 'three';

// Add loading placeholder component
const LoadingPlaceholder = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="gray" opacity={0.5} transparent />
    </mesh>
  );
};

const Assistant3D: React.FC = () => {
  const modelRef = useRef<Group>(null);
  const mountedRef = useRef(true);
  const { viewport } = useThree();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Optimize model loading
  const { scene, nodes } = useGLTF('/models/assistant.glb', true, true);
  const clock = useRef(new Clock());
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    const model = modelRef.current;

    // Set loaded state when model is ready
    if (scene) {
      setIsLoaded(true);
    }

    return () => {
      mountedRef.current = false;
      if (model) {
        model.clear();
      }
    };
  }, [scene]);

  useFrame(() => {
    if (!modelRef.current || !mountedRef.current || !isLoaded) return;
    
    try {
      // Optimize animations with RAF
      requestAnimationFrame(() => {
        if (!modelRef.current) return;
        
        const scale = Math.min(viewport.width, viewport.height) * 0.15;
        const baseScale = Math.max(0.5, Math.min(scale, 2));
        const currentScale = isHovered ? baseScale * 1.05 : baseScale;
        
        const time = clock.current.getElapsedTime();
        const scaleOffset = Math.sin(time * 0.2) * 0.03;
        const finalScale = currentScale * (1 + scaleOffset);
        
        modelRef.current.scale.set(finalScale, finalScale, finalScale);
        modelRef.current.position.y = Math.sin(time * 0.5) * 0.1;
        modelRef.current.rotation.y = Math.sin(time * 0.3) * 0.1;
      });
    } catch (error) {
      console.warn('Error in animation frame:', error);
    }
  });

  const modelToRender = nodes?.computer || scene;

  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <group
        ref={modelRef}
        position={[0, 0, 0]}
        visible={isLoaded}
        onPointerEnter={() => mountedRef.current && setIsHovered(true)}
        onPointerLeave={() => mountedRef.current && setIsHovered(false)}
      >
        <primitive object={modelToRender} />
      </group>
    </Suspense>
  );
};

// Preload with low priority
useGLTF.preload('/models/assistant.glb', true);

export default Assistant3D;