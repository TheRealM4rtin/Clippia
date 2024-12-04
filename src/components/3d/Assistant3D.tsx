import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, Clock } from 'three';

const Assistant3D: React.FC = () => {
  const modelRef = useRef<Group>(null);
  const mountedRef = useRef(true);
  const { viewport } = useThree();
  const { scene, nodes } = useGLTF('/models/assistant.glb');
  const clock = useRef(new Clock());
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Clean up any animations or ongoing processes
      if (modelRef.current) {
        modelRef.current.clear();
      }
    };
  }, []);

  useFrame(() => {
    if (!modelRef.current || !mountedRef.current) return;
    
    try {
      // Calculate scale based on viewport size
      const scale = Math.min(viewport.width, viewport.height) * 0.15;
      const baseScale = Math.max(0.5, Math.min(scale, 2));
      const currentScale = isHovered ? baseScale * 1.05 : baseScale;
      
      // Add gentle floating and rotation animation
      const time = clock.current.getElapsedTime();
      const scaleOffset = Math.sin(time * 0.2) * 0.03;
      const finalScale = currentScale * (1 + scaleOffset);
      
      modelRef.current.scale.set(finalScale, finalScale, finalScale);
      modelRef.current.position.y = Math.sin(time * 0.5) * 0.1;
      modelRef.current.rotation.y = Math.sin(time * 0.3) * 0.1;
    } catch (error) {
      console.warn('Error in animation frame:', error);
    }
  });

  // If nodes.computer doesn't exist, use the entire scene
  const modelToRender = nodes?.computer || scene;

  return (
    <group
      ref={modelRef}
      position={[0, 0, 0]}
      onPointerEnter={() => mountedRef.current && setIsHovered(true)}
      onPointerLeave={() => mountedRef.current && setIsHovered(false)}
    >
      <primitive object={modelToRender} />
    </group>
  );
};

// Preload the model
useGLTF.preload('/models/assistant.glb');

export default Assistant3D;