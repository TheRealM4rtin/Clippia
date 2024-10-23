import React, { useCallback, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Camera, useThree } from '@react-three/fiber';

const FileIcon = () => (
  <div className="flex flex-col items-center m-2 cursor-pointer hover:bg-gray-200 p-1">
    <div className="w-8 h-8 bg-white border border-gray-400 flex items-center justify-center text-xs">
      .txt
    </div>
    <span className="text-xs mt-1">document.txt</span>
  </div>
);

const FolderIcon = () => (
  <div className="flex flex-col items-center m-2 cursor-pointer hover:bg-gray-200 p-1">
    <div className="w-8 h-8 bg-yellow-100 border border-yellow-400 flex items-center justify-center">
      📁
    </div>
    <span className="text-xs mt-1">My Folder</span>
  </div>
);

interface MyComputerWindowProps {
  position: [number, number, number];
  zIndex: number;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  scale: number;
  onPositionChange?: (x: number, y: number) => void;
  camera: Camera;
  size: { width: number; height: number };
}

const MyComputerWindow: React.FC<MyComputerWindowProps> = ({
  position,
  zIndex,
  onClose,
  onMinimize,
  onMaximize,
  scale,
  onPositionChange,
  camera,
  size,
}) => {
  const [currentPath, setCurrentPath] = useState('C:\\');
  const baseWidth = 500;
  const baseHeight = 300;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({x: 0, y: 0});


  const handleTitleBarMouseDown = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsDragging(true);
    const worldPosition = new THREE.Vector3(position[0], position[1], 0);
    const screenPosition = worldPosition.project(camera);
    const x = (screenPosition.x + 1) * size.width / 2;
    const y = (-screenPosition.y + 1) * size.height / 2;
    setDragStart({ x: event.clientX - x, y: event.clientY - y });
  }, [camera, position, size]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging && onPositionChange) {
      event.preventDefault();
      const x = (event.clientX - dragStart.x) / size.width * 2 - 1;
      const y = -(event.clientY - dragStart.y) / size.height * 2 + 1;
      const vector = new THREE.Vector3(x, y, 0).unproject(camera);
      onPositionChange(vector.x, vector.y);
    }
  }, [isDragging, dragStart, onPositionChange, camera, size]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  
  return (
    <group position={position}>
      <Html
        transform
        scale={scale}
        zIndexRange={[zIndex + 2, zIndex + 2]}
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
        }}
      >
        <div 
          className="window"
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${1 / scale})`,
            transformOrigin: 'top left',
            backgroundColor: '#D4D0C8',
          }}
        >
          <div className="title-bar" onMouseDown={handleTitleBarMouseDown} style={{cursor: 'move'}}>
            <span className="title-bar-text">My Computer</span>
            <div className="title-bar-controls">
              <button aria-label="Minimize" onClick={onMinimize}></button>
              <button aria-label="Maximize" onClick={onMaximize}></button>
              <button aria-label="Close" onClick={onClose}></button>
            </div>
          </div>

          <div 
            className="window-body"
            style={{
              height: 'calc(100% - 2rem)',
              padding: '1rem',
              overflow: 'auto',
              backgroundColor: 'white',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(6rem, 1fr))',
              gap: '1rem',
              alignItems: 'start',
            }}
          >
            <div className="bg-gray-100 p-1 border-b border-gray-400">
              <div className="flex items-center">
                <span className="text-xs mr-2">Address:</span>
                <input 
                  type="text" 
                  value={currentPath}
                  onChange={(e) => setCurrentPath(e.target.value)}
                  className="flex-grow text-xs p-1"
                />
              </div>
            </div>

            <div className="flex-grow p-2 overflow-auto bg-white">
              <div className="flex flex-wrap">
                <FolderIcon />
                <FolderIcon />
                <FileIcon />
                <FileIcon />
                <FileIcon />
              </div>
            </div>

            <div className="bg-gray-100 p-1 border-t border-gray-400">
              <span className="text-xs">5 items</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};

export default MyComputerWindow;