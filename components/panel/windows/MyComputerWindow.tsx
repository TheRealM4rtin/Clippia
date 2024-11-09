import React, { useRef, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { useAppStore } from '@/lib/store';
import { Wmsui323920, Notepad2 } from '@react95/icons';
import commonStyles from '../style/common.module.css';
import styles from '../style/MyComputerWindow.module.css';
import { useAuth } from '@/contexts/AuthContext';

const MyComputerWindow: React.FC<NodeProps> = ({ id, data }) => {
  const { updateWindow, removeWindow, addWindow, windows } = useAppStore();
  const nodeRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [currentPath] = useState(() => {
    const userEmail = user?.email || 'anonymous';
    return `C:\\Users\\${userEmail.split('@')[0]}\\Documents`;
  });

  const handleClick = () => {
    const highestZIndex = Math.max(...windows.map(w => w.zIndex)) + 1;
    updateWindow(id, { zIndex: highestZIndex });
  };

  const handleClose = () => {
    removeWindow(id);
  };

  const openFile = (title: string, content: string) => {
    const existingWindow = windows.find(w => w.title === title && w.type === 'text');
    if (existingWindow) {
      updateWindow(existingWindow.id, { 
        zIndex: Math.max(...windows.map(w => w.zIndex)) + 1 
      });
    } else {
      addWindow({
        title,
        content,
        type: 'text',
        isReadOnly: true,
        zIndex: Math.max(...windows.map(w => w.zIndex)) + 1,
      });
    }
  };

  const handleOpenAboutFile = () => {
    const aboutTxtContent = "Made with ❤️ by [Martin](https://x.com/mrtincss)";
    openFile('About.txt', aboutTxtContent);
  };

  const handleOpenChangelogFile = () => {
    const changelogTxtContent = [
      "### clippia.io v1.0",
      "**Features**",
      "- Infinite whiteboard",
      "- Windows 98-style UI",
      "- Resizable windows",
      "- Drag and drop windows",
      "- Tiptap rich text editor",
      "",
      "**Roadmap**",
      "- Amiga music player",
    ].join('\n');
    openFile('Changelog.txt', changelogTxtContent);
  };

  return (
    <div 
      ref={nodeRef} 
      className={commonStyles.window}
      onClick={handleClick}
      style={{ zIndex: data.zIndex as number }}
    >
      <div className={commonStyles.titleBar}>
        <div className={commonStyles.titleBarText}>My Computer</div>
        <div className="title-bar-controls">
          <button aria-label="Close" onClick={handleClose} />
        </div>
      </div>
      <div className={commonStyles.windowBody}>
        <p>{currentPath}</p>
        <ul className={styles.fileList}>
          <li className={styles.fileItem}>
            <Wmsui323920 className={styles.fileIcon} />
            My Folder
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
