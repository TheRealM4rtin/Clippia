import React from 'react';
import { BaseWindowProps } from '@/types/components/window';
import styles from './styles.module.css';

export interface BaseWindowComponentProps extends BaseWindowProps {
  onClose: () => void;
  onFocus: () => void;
  children: React.ReactNode;
}

export const BaseWindow: React.FC<BaseWindowComponentProps> = ({
  title,
  zIndex,
  position,
  size,
  onClose,
  onFocus,
  children,
}) => {
  return (
    <div 
      className={styles.window}
      style={{
        zIndex,
        position: 'absolute',
        top: position?.y || '50%',
        left: position?.x || '50%',
        width: size?.width,
        height: size?.height,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={onFocus}
    >
      <div className={styles.titleBar}>
        <div className={styles.title}>{title}</div>
        <button className={styles.closeButton} onClick={onClose} />
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}; 