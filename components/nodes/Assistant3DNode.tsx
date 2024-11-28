import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Canvas } from '@react-three/fiber';
import Assistant3D from '../Assistant3D';
import CameraController from '../CameraController';

const Assistant3DNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div style={{ 
      width: 300, 
      height: 300,
      background: 'transparent',
      borderRadius: '8px',
      pointerEvents: 'all'
    }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraController />
        <Assistant3D />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
      </Canvas>
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  );
};

export default Assistant3DNode;