import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import TextWindow from '@/components/TextWindow'
import Panel from '@/components/Panel'
import CameraController from '@/components/CameraController'
//import WindowsContainer from './WindowsContainer'
import styles from './whiteboard.module.css';

interface Window {
  id: number
  title: string
  text: string
  x: number
  y: number
  zIndex: number
  creationTime: Date
  width: number
  height: number
  isNew: boolean
}

interface SceneProps {
  windows: Window[]
  updateWindowPosition: (id: number, newX: number, newY: number) => void
  removeWindow: (id: number) => void
  updateWindowText: (id: number, text: string) => void
  updateWindowTitle: (id: number, title: string) => void
  updateWindowSize: (id: number, width: number, height: number) => void
  cameraPosition: { x: number; y: number }
  cameraZoom: number
  updateCursorStyle: (style: string) => void
}

function Scene({ 
  windows, 
  updateWindowPosition, 
  removeWindow, 
  updateWindowText,
  updateWindowTitle, 
  updateWindowSize,
  cameraPosition,
  cameraZoom,
  updateCursorStyle
}: SceneProps) {
  const { camera, size } = useThree()
  
  useEffect(() => {
    camera.position.x = cameraPosition.x
    camera.position.y = cameraPosition.y
    camera.zoom = 50 * cameraZoom
    camera.updateProjectionMatrix()
  }, [camera, cameraPosition, cameraZoom])

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {windows.map((window) => (
        <TextWindow
          key={window.id}
          position={[window.x, window.y, 0]}
          id={window.id}
          initialTitle={window.title}
          initialText={window.text}
          zIndex={window.zIndex}
          onClose={() => removeWindow(window.id)}
          onMinimize={() => {}}
          onMaximize={() => {}}
          onTextChange={(text) => updateWindowText(window.id, text)}
          onTitleChange={(title) => updateWindowTitle(window.id, title)}
          onPositionChange={(newX, newY) => updateWindowPosition(window.id, newX, newY)}
          scale={1 / cameraZoom}
          creationTime={window.creationTime}
          onResize={(width, height) => updateWindowSize(window.id, width, height)}
          width={window.width}
          height={window.height}
          camera={camera}
          size={size} 
          updateCursorStyle={updateCursorStyle}
          isNew={window.isNew}
        />
      ))}
    </>
  )
}

const Whiteboard: React.FC = () => {
  const [windows, setWindows] = useState<Window[]>([])
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 })
  const [cameraZoom, setCameraZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canvasRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cursorStyle, setCursorStyle] = useState('default')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [colorBackground, setColorBackground] = useState(false)
  const [disableAnimation, setDisableAnimation] = useState(false)
  const [cloudBackground, setCloudBackground] = useState(false)

  useEffect(() => {
    const updateSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const addWindow = useCallback(() => {
    const defaultWidth = 400
    const defaultHeight = 320
    const offset = 2 / (cameraZoom * 50)

    let newX: number, newY: number

    if (windows.length > 0) {
      const lastWindow = windows[windows.length - 1]
      
      const viewLeft = cameraPosition.x - (defaultWidth / 2) / (cameraZoom * 50)
      const viewRight = cameraPosition.x + (defaultWidth / 2) / (cameraZoom * 50)
      const viewTop = cameraPosition.y + (defaultHeight / 2) / (cameraZoom * 50)
      const viewBottom = cameraPosition.y - (defaultHeight / 2) / (cameraZoom * 50)

      if (lastWindow.x >= viewLeft && lastWindow.x <= viewRight &&
          lastWindow.y >= viewBottom && lastWindow.y <= viewTop) {
        newX = lastWindow.x + offset
        newY = lastWindow.y - offset
      } else {
        newX = cameraPosition.x
        newY = cameraPosition.y
      }
    } else {
      newX = cameraPosition.x
      newY = cameraPosition.y
    }

    newX -= (defaultWidth / 4) / (cameraZoom * 50)
    newY += (defaultHeight / 4) / (cameraZoom * 50)

    const newWindow: Window = { 
      id: Date.now(), 
      title: 'New Window',
      text: 'Type here to start...', 
      x: newX,
      y: newY,
      zIndex: windows.length,
      creationTime: new Date(),
      width: defaultWidth,
      height: defaultHeight,
      isNew: true,
    }
    setWindows(prevWindows => [...prevWindows, newWindow])
  }, [cameraPosition, cameraZoom, windows])

  const removeWindow = useCallback((id: number) => {
    setWindows(prevWindows => prevWindows.filter(window => window.id !== id))
  }, [])

  const updateWindowText = useCallback((id: number, text: string) => {
    setWindows(prevWindows => prevWindows.map(window => 
      window.id === id ? { ...window, text } : window
    ))
  }, [])

  const updateWindowTitle = useCallback((id: number, title: string) => {
    setWindows(prevWindows => prevWindows.map(window => 
      window.id === id ? { ...window, title } : window
    ))
  }, [])

  const updateWindowPosition = useCallback((id: number, newX: number, newY: number) => {
    setWindows(prevWindows => prevWindows.map(window => 
      window.id === id ? { ...window, x: newX, y: newY } : window
    ))
  }, [])

  const updateWindowSize = useCallback((id: number, width: number, height: number) => {
    setWindows(prevWindows =>
      prevWindows.map(window =>
        window.id === id ? { ...window, width, height } : window
      )
    )
  }, [])

  const resetView = useCallback(() => {
    setCameraPosition({ x: 0, y: 0 })
    setCameraZoom(1)
  }, [])

  const updateCursorStyle = useCallback((style: string) => {
    setCursorStyle(style);
  }, []);

  const toggleCloudBackground = useCallback(() => {
    setCloudBackground(prev => !prev)
  }, [])

  const toggleCloudAnimation = useCallback(() => {
    setDisableAnimation(prev => !prev)
  }, [])

  const toggleColorBackground = useCallback(() => {
    setColorBackground(prev => !prev)
  }, [])

  return (
    <main className={styles.whiteboard}>
      {colorBackground ? (
        <div className={styles.colorBackground} aria-hidden="true" />
      ) : (
        <div 
          className={`${styles.cloudBackground} ${!disableAnimation ? styles.animated : ''}`} 
          aria-hidden="true"
        />
      )}
      <Canvas
        orthographic
        camera={{ zoom: 50, position: [0, 0, 100] }}
        dpr={window.devicePixelRatio}
        className={styles.canvas}
        gl={{ preserveDrawingBuffer: true, alpha: true }}
      >
        <CameraController
          cameraPosition={cameraPosition}
          setCameraPosition={setCameraPosition}
          cameraZoom={cameraZoom}
          setCameraZoom={setCameraZoom}
          isPanning={isPanning}
          setIsPanning={setIsPanning}
          updateCursorStyle={updateCursorStyle}
        />
        <Scene
          windows={windows}
          updateWindowPosition={updateWindowPosition}
          removeWindow={removeWindow}
          updateWindowText={updateWindowText}
          updateWindowTitle={updateWindowTitle}
          updateWindowSize={updateWindowSize}
          cameraPosition={cameraPosition}
          cameraZoom={cameraZoom}
          updateCursorStyle={updateCursorStyle}
        />
      </Canvas>
      <div className={styles.panel}>
        <Panel
          windowCount={windows.length}
          x={cameraPosition.x}
          y={cameraPosition.y}
          scale={cameraZoom}
          onAddWindow={addWindow}
          onResetView={resetView}
          colorBackground={colorBackground}
          toggleColorBackground={toggleColorBackground}
          disableAnimation={disableAnimation}
          toggleCloudAnimation={toggleCloudAnimation}
          cloudBackground={cloudBackground}
          toggleCloudBackground={toggleCloudBackground}
        />
      </div>
    </main>
  )
}

export default Whiteboard
