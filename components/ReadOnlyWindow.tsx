import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import Placeholder from '@tiptap/extension-placeholder';

interface ReadOnlyWindowProps {
  title: string;
  content: string;
  isReadOnly: boolean;
  position: [number, number, number];
  onPositionChange: (x: number, y: number) => void;
  scale: number;
  camera: THREE.Camera;
  size: { width: number; height: number };
  onResize: (width: number, height: number) => void;
  width: number;
  height: number;
  onClose: () => void;
}

const ReadOnlyWindow: React.FC<ReadOnlyWindowProps> = ({
  title,
  content,
  isReadOnly,
  position,
  onPositionChange,
  scale,
  camera,
  size,
  onResize,
  width,
  height,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width, height });
  const windowRef = useRef<HTMLDivElement>(null);

  // Initialize Tiptap editor with Markdown support
  const editor = useEditor({
    extensions: [
        StarterKit,
        Markdown.configure({
            html: false, // Ensure Markdown is used
        }),
    ],
    content,
    editable: false,
  });

  const handleDragStart = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsDragging(true);
    if (camera && size) {
      const worldPosition = new THREE.Vector3(position[0], position[1], 0);
      const screenPosition = worldPosition.project(camera);
      const x = (screenPosition.x + 1) * size.width / 2;
      const y = (-screenPosition.y + 1) * size.height / 2;
      setDragStart({ x: event.clientX - x, y: event.clientY - y });
    } else {
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  }, [camera, size, position]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging && camera && size) {
      event.preventDefault();
      const x = (event.clientX - dragStart.x) / size.width * 2 - 1;
      const y = -(event.clientY - dragStart.y) / size.height * 2 + 1;
      const vector = new THREE.Vector3(x, y, 0).unproject(camera);
      onPositionChange(vector.x, vector.y);
    }
    if (isResizing) {
      event.preventDefault();
      const deltaX = (event.clientX - resizeStart.x) / scale;
      const deltaY = (event.clientY - resizeStart.y) / scale;
      
      const newWidth = Math.max(initialSize.width + deltaX, 200);
      const newHeight = Math.max(initialSize.height + deltaY, 150);

      const maxChange = 100 / scale;
      const clampedWidth = Math.min(newWidth, initialSize.width + maxChange);
      const clampedHeight = Math.min(newHeight, initialSize.height + maxChange);

      onResize(clampedWidth, clampedHeight);
    }
  }, [isDragging, isResizing, dragStart, resizeStart, camera, size, scale, initialSize, onPositionChange, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [handleMouseMove, handleMouseUp]);

  const handleResizeStart = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: event.clientX, y: event.clientY });
    setInitialSize({ width, height });
  }, [width, height]);

  return (
    <group position={position}>
      <Html
        transform
        scale={scale}
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        <div 
          ref={windowRef}
          className="window" 
          style={{ 
            width: '100%', 
            height: '100%', 
            overflow: 'hidden',
            transform: `scale(${1 / scale})`,
            transformOrigin: 'top left',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <div 
            className="title-bar" 
            onMouseDown={handleDragStart}
            style={{ cursor: 'move' }}
          >
            <span className="title-bar-text">{title}</span>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close" onClick={(e) => { e.stopPropagation(); onClose(); }}></button>
            </div>
          </div>

          <div className="window-body" style={{ flex: 1, padding: '5px', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <EditorContent 
              editor={editor} 
              style={{ 
                flex: 1, 
                overflow: 'auto', 
                whiteSpace: 'pre-wrap', 
                wordWrap: 'break-word', 
                padding: '4px' 
              }} 
            />
          </div>

          {/* Resize handle */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              cursor: 'se-resize',
              zIndex: 1000,
            }}
            onMouseDown={handleResizeStart}
          />
        </div>
      </Html>
    </group>
  );
};

export default ReadOnlyWindow;
