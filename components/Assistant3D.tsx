import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Vector3, Euler } from 'three';
import { useAppStore } from '@/lib/store';
import { useGesture } from '@use-gesture/react';
import * as THREE from 'three';

const Assistant3D: React.FC = () => {
  const modelRef = useRef<THREE.Group>();
  const gltf = useLoader(GLTFLoader, '/models/computer.glb');
  
  // Animation parameters
  const floatAmplitude = 0.002;    // Height of the floating motion (reduced from 0.008)
  const floatFrequency = 0.05;     // Speed of the floating motion (reduced from 0.3)
  const rotationSpeed = 0.0005;    // Speed of idle rotation
  const rotationAmount = 0.05;     // Amount of idle rotation
  
  // Animation loop
  useFrame((_, delta) => {
    if (!modelRef.current) return;

    // Floating animation
    const floatOffset = Math.sin(Date.now() * 0.001 * floatFrequency) * floatAmplitude;
    
    // Update model position and rotation
    modelRef.current.position.y += floatOffset * delta;
    modelRef.current.rotation.y = Math.sin(Date.now() * rotationSpeed) * rotationAmount + (Math.PI / 36); // Added 5 degrees rotation
  });

  return (
    <group
      ref={modelRef}
      scale={[0.03, 0.03, 0.03]}
    >
      <primitive object={gltf.scene} />
    </group>
  );
};

export default Assistant3D; 