import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Vector3, Euler } from 'three';
import { useAppStore } from '@/lib/store';
import { useGesture } from '@use-gesture/react';

const Assistant3D: React.FC = () => {
  const modelRef = useRef<THREE.Group>();
  const gltf = useLoader(GLTFLoader, '/models/computer.glb');
  const { viewport } = useAppStore();
  
  // State for position and animation
  const [position] = useState(new Vector3(0, 0, 0));
  const [targetPosition] = useState(new Vector3(0, 0, 0));
  const [velocity] = useState(new Vector3(0, 0, 0));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<Vector3 | null>(null);
  
  // Animation parameters
  const floatAmplitude = 0.002;    // Height of the floating motion (reduced from 0.008)
  const floatFrequency = 0.05;     // Speed of the floating motion (reduced from 0.3)
  const dragSpeed = 0.0007;         // Speed when dragging the object
  const throwMultiplier = 0.02;    // Multiplier for throw velocity
  const lerpFactor = 0.02;         // Speed of following the viewport (0.02 = 2% per frame)
  const velocityDecay = 0.98;      // How quickly throw velocity decays (0.98 = 2% decay per frame)
  const rotationSpeed = 0.0005;    // Speed of idle rotation
  const rotationAmount = 0.05;     // Amount of idle rotation
  
  // Update target position based on viewport changes
  useEffect(() => {
    if (!isDragging && modelRef.current) {
      targetPosition.set(
        viewport.x + window.innerWidth * 0.8 / viewport.zoom,
        viewport.y + window.innerHeight * 0.8 / viewport.zoom,
        0
      );
    }
  }, [viewport, isDragging, targetPosition]);

  // Gesture handling for drag and throw
  const bind = useGesture({
    onDragStart: () => {
      setIsDragging(true);
      if (modelRef.current) {
        setDragStartPosition(modelRef.current.position.clone());
      }
    },
    onDrag: ({ delta: [dx, dy] }) => {
      if (modelRef.current && dragStartPosition) {
        const currentDragSpeed = dragSpeed / viewport.zoom;
        modelRef.current.position.x += dx * currentDragSpeed;
        modelRef.current.position.y -= dy * currentDragSpeed;
      }
    },
    onDragEnd: ({ velocity: [vx, vy] }) => {
      setIsDragging(false);
      setDragStartPosition(null);
      if (modelRef.current) {
        velocity.set(vx * throwMultiplier, -vy * throwMultiplier, 0);
      }
    }
  });

  // Animation loop
  useFrame((_, delta) => {
    if (!modelRef.current) return;

    // Floating animation
    const floatOffset = Math.sin(Date.now() * 0.001 * floatFrequency) * floatAmplitude;
    
    // Update position with lerp if not dragging
    if (!isDragging) {
      position.lerp(targetPosition, lerpFactor);
      
      // Apply velocity and decay
      if (velocity.length() > 0.001) {
        modelRef.current.position.add(velocity.multiplyScalar(delta));
        velocity.multiplyScalar(velocityDecay);
      }
    }

    // Update model position and rotation
    modelRef.current.position.y += floatOffset * delta;
    modelRef.current.rotation.y = Math.sin(Date.now() * rotationSpeed) * rotationAmount + (Math.PI / 90); // Added 2 degrees rotation
    
    // Constrain to viewport bounds
    const bounds = {
      minX: viewport.x - window.innerWidth / viewport.zoom,
      maxX: viewport.x + window.innerWidth / viewport.zoom,
      minY: viewport.y - window.innerHeight / viewport.zoom,
      maxY: viewport.y + window.innerHeight / viewport.zoom
    };

    modelRef.current.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, modelRef.current.position.x));
    modelRef.current.position.y = Math.max(bounds.minY, Math.min(bounds.maxY, modelRef.current.position.y));
  });

  return (
    <group
      ref={modelRef}
      position={position}
      scale={[0.01, 0.01, 0.01]}
      {...bind()}
    >
      <primitive object={gltf.scene} />
    </group>
  );
};

export default Assistant3D; 