import React, { useState, useCallback } from 'react'
import { Html } from '@react-three/drei'
import { Wmsui323920, Notepad2 } from '@react95/icons'
import Draggable from 'react-draggable'
import { useAppStore } from '@/lib/store'
import { Window } from '@/types/Window'
import { useThree } from '@react-three/fiber'

interface MyComputerWindowProps {
  window: Window
}

const MyComputerWindow: React.FC<MyComputerWindowProps> = ({ window }) => {
  const [currentPath] = useState('C:\\')
  const { updateWindow, removeWindow, addWindow, windows } = useAppStore()
  const { size } = useThree()

  const handleDrag = useCallback((_e: any, data: { x: number; y: number }) => {
    const newX = data.x / size.width
    const newY = data.y / size.height
    updateWindow(window.id, { position: { x: newX, y: newY } })
  }, [updateWindow, window.id, size])

  const openFile = (title: string, content: string) => {
    const existingWindow = windows.find(w => w.title === title && w.type === 'text')
    if (existingWindow) {
      // Bring the existing window to the front
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
    <Html>
      <Draggable
        position={{x: window.position.x * size.width, y: window.position.y * size.height}}
        onDrag={handleDrag}
      >
        <div className="window" style={{
          width: `${window.size.width * size.width}px`,
          height: `${window.size.height * size.height}px`,
          position: 'absolute',
          zIndex: window.zIndex,
        }}>
          <div className="title-bar">
            <div className="title-bar-text">My Computer</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close" onClick={() => removeWindow(window.id)}></button>
            </div>
          </div>
          <div className="window-body">
            <p>Current path: {currentPath}</p>
            <ul className="tree-view">
              <li>
                <Wmsui323920 style={{marginRight: '5px'}} />
                My Folder
              </li>
              <li>
                <Notepad2 style={{marginRight: '5px'}} onClick={handleOpenAboutFile} />
                About.txt
              </li>
              <li>
                <Notepad2 style={{marginRight: '5px'}} onClick={handleOpenChangelogFile} />
                Changelog.txt
              </li>
            </ul>
          </div>
        </div>
      </Draggable>
    </Html>
  )
}

export default MyComputerWindow
