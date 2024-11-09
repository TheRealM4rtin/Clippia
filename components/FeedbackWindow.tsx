import React, { useRef } from 'react';
import { NodeProps } from '@xyflow/react';
import { useAppStore } from '@/lib/store';
import styles from './FeedbackWindow.module.css';
import FeedbackContent from '@/components/panel/tabs/Feedback';

const FeedbackWindow: React.FC<NodeProps> = ({ id, data }) => {
  const { updateWindow, removeWindow, windows } = useAppStore();
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    const highestZIndex = Math.max(...windows.map(w => w.zIndex)) + 1;
    updateWindow(id, { zIndex: highestZIndex });
  };

  const handleClose = () => {
    removeWindow(id);
  };

  return (
    <div 
      ref={nodeRef} 
      className={styles.window}
      onClick={handleClick}
      style={{ zIndex: data.zIndex as number }}
    >
      <div className={styles.titleBar}>
        <div className={styles.titleBarText}>Feedback.exe</div>
        <div className="title-bar-controls">
          <button aria-label="Close" onClick={handleClose} />
        </div>
      </div>
      <div className={styles.windowBody}>
        <FeedbackContent width={400} />
      </div>
    </div>
  );
};

export default FeedbackWindow;