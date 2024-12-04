import React, { useCallback, useRef } from 'react';
import Draggable, { DraggableEvent } from 'react-draggable';
import { Html } from '@react-three/drei';
import { WindowData } from '@/types/window';

interface ReadOnlyWindowProps {
  window: WindowData;
  onClose: () => void;
  onUpdate: (updates: Partial<WindowData>) => void;
}

const ReadOnlyWindow: React.FC<ReadOnlyWindowProps> = ({ window, onClose, onUpdate }) => {
  const nodeRef = useRef(null);

  const handleDrag = useCallback((_e: DraggableEvent, data: { x: number; y: number }) => {
    onUpdate({ position: { x: data.x, y: data.y } });
  }, [onUpdate]);

  return (
    <Html>
      <Draggable
        nodeRef={nodeRef}
        position={window.position}
        onDrag={handleDrag}
        bounds="parent"
      >
        <div
          ref={nodeRef}
          className="window"
          style={{
            width: window.size?.width ?? '50vw',
            height: window.size?.height ?? '60vh',
            maxWidth: '90vw',
            maxHeight: '90vh',
            minWidth: '300px',
            minHeight: '200px',
            zIndex: window.zIndex,
          }}
        >
          <div className="title-bar">
            <div className="title-bar-text">{window.title}</div>
            <div className="title-bar-controls">
              <button aria-label="Close" onClick={onClose} />
            </div>
          </div>
          <div className="window-body">
            <div dangerouslySetInnerHTML={{ __html: window.content }} />
          </div>
        </div>
      </Draggable>
    </Html>
  );
};

export default ReadOnlyWindow;
