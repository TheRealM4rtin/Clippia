import React, { useRef } from 'react';
import { NodeProps } from '@xyflow/react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Computer, Notepad2 } from '@react95/icons';
import commonStyles from '../style/common.module.css';
import styles from '../style/MyComputerWindow.module.css';
import { WindowData } from '@/types/window';

type MyComputerProps = NodeProps<{
  id: string;
  position: { x: number; y: number };
  data: WindowData & { type: 'myComputer' };
}>;

const MyComputerWindow: React.FC<MyComputerProps> = ({ 
  id, 
  data
}) => {
  const { updateWindow, removeWindow, addWindow, windows: { windows } } = useAppStore();
  const nodeRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const userPath = user ? `C:\\Users\\${user.email?.split('@')[0]}\\Documents` : 'C:\\Users\\Guest\\Documents';

  const handleClick = () => {
    const highestZIndex = Math.max(...windows.map(w => w.zIndex || 0)) + 1;
    if (id) {
      updateWindow(id, { zIndex: highestZIndex });
    }
  };

  const handleClose = () => {
    if (id) {
      removeWindow(id);
    }
  };

  const openFile = (title: string, content: string) => {
    const existingWindow = windows.find(w => w.title === title && w.type === 'text');
    if (existingWindow?.id) {
      updateWindow(existingWindow.id, { 
        zIndex: Math.max(...windows.map(w => w.zIndex || 0)) + 1 
      });
    } else {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      addWindow({
        title,
        content,
        type: 'text',
        isReadOnly: true,
        position: {
          x: viewportWidth / 2 - 150,
          y: viewportHeight / 2 - 100
        },
        size: { width: 300, height: 200 },
        zIndex: Math.max(...windows.map(w => w.zIndex || 0)) + 1,
      });
    }
  };

  const handleOpenAboutFile = () => {
    openFile('About.txt', `
      Clippia - A Windows 95-style Clipboard Manager
      Version: 1.0.0
      
      Clippia is a modern clipboard manager with a nostalgic Windows 95 interface.
      It allows you to manage multiple clipboard items, organize them in windows,
      and access them quickly when needed.
      
      Features:
      - Multiple clipboard items
      - Windows 95 style interface
      - Markdown support
      - Cloud sync (coming soon)
      
      Created with ❤️ using Next.js, React95, and Three.js
    `);
  };

  const handleOpenChangelogFile = () => {
    openFile('Changelog.txt', `
      Changelog
      
      v1.0.0 (2023-12-03)
      - Initial release
      - Basic clipboard management
      - Windows 95 interface
      - Markdown support
      
      Coming Soon:
      - Cloud sync
      - Multiple workspaces
      - Keyboard shortcuts
      - Search functionality
    `);
  };

  const handleOpenLoginWindow = () => {
    const existingLogin = windows.find(w => w.type === 'login');
    if (existingLogin?.id) {
      updateWindow(existingLogin.id, { 
        zIndex: Math.max(...windows.map(w => w.zIndex || 0)) + 1 
      });
    } else {
      addWindow({
        title: 'Login',
        content: '',
        type: 'login',
        zIndex: Math.max(...windows.map(w => w.zIndex || 0)) + 1,
      });
    }
  };

  return (
    <div 
      ref={nodeRef}
      className={commonStyles.window}
      onClick={handleClick}
      style={{ 
        zIndex: Math.min(data.zIndex || 0, 999999),
        position: 'absolute',
        width: '300px',
        height: '400px'
      }}
    >
      <div className={commonStyles.titleBar}>
        <div className={commonStyles.titleBarText}>
          {data.title}
        </div>
        <button className={commonStyles.closeButton} onClick={handleClose}>
          ✕
        </button>
      </div>

      <div className={styles.content}>
        <p>{userPath}</p>
        <ul className={styles.fileList}>
          <li className={styles.fileItem} onClick={handleOpenLoginWindow}>
            <Computer className={styles.fileIcon} />
            Connect.exe
          </li>
          <li className={styles.fileItem} onClick={handleOpenAboutFile}>
            <Notepad2 className={styles.fileIcon} />
            About.txt
          </li>
          <li className={styles.fileItem} onClick={handleOpenChangelogFile}>
            <Notepad2 className={styles.fileIcon} />
            Changelog.txt
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MyComputerWindow;
