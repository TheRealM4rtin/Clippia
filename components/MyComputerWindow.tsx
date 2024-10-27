import React, { useCallback, useRef, useState } from 'react'
import Draggable, { DraggableEvent } from 'react-draggable'
import { useAppStore } from '@/lib/store'
import { Window } from '@/types/window'
import { Wmsui323920, Notepad2 } from '@react95/icons'
import styles from './MyComputerWindow.module.css'

interface MyComputerWindowProps {
  window: Window
  viewportSize: { width: number; height: number }
}

const MyComputerWindow: React.FC<MyComputerWindowProps> = ({ window, viewportSize }) => {
  const { updateWindow, removeWindow, addWindow, windows } = useAppStore()
  const nodeRef = useRef<HTMLDivElement>(null)
  const [currentPath] = useState('C:\\')

  const handleDrag = useCallback((_e: DraggableEvent, data: { x: number; y: number }) => {
    const newX = data.x / viewportSize.width
    const newY = data.y / viewportSize.height
    updateWindow(window.id, { position: { x: newX, y: newY } })
  }, [updateWindow, window.id, viewportSize])

  const openFile = (title: string, content: string) => {
    const existingWindow = windows.find(w => w.title === title && w.type === 'text')
    if (existingWindow) {
      updateWindow(existingWindow.id, { zIndex: Math.max(...windows.map(w => w.zIndex)) + 1 })
    } else {
      addWindow({
        title,
        content,
        isReadOnly: true,
        type: 'text',
      })
    }
  }

  const handleOpenAboutFile = () => {
    const aboutTxtContent = "Made with ❤️ by [Martin](https://x.com/mrtincss)"
    openFile('About.txt', aboutTxtContent)
  }

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
    ].join('\n')
    openFile('Changelog.txt', changelogTxtContent)
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{x: window.position.x * viewportSize.width, y: window.position.y * viewportSize.height}}
      onDrag={handleDrag}
    >
      <div ref={nodeRef} className={styles.window} style={{
        width: `${window.size.width * viewportSize.width}px`,
        height: `${window.size.height * viewportSize.height}px`,
        zIndex: window.zIndex,
      }}>
        <div className={styles.titleBar}>
          <div className={styles.titleBarText}>My Computer</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close" onClick={() => removeWindow(window.id)}></button>
          </div>
        </div>
        <div className={styles.windowBody}>
          <p>Current path: {currentPath}</p>
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
    </Draggable>
  )
}

export default MyComputerWindow
