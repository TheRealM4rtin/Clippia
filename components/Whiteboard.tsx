import React, { useState, useCallback, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import TextWindow from '@/components/TextWindow'
import Panel from '@/components/Panel'
import CameraController from '@/components/CameraController'
import styles from './whiteboard.module.css';
import MyComputerWindow from '@/components/MyComputerWindow'
import ReadOnlyWindow from '@/components/ReadOnlyWindow'
import logger from '@/lib/logger';


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
  isReadOnly: boolean
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
  isComputerOpen: boolean
  computerPosition: [number, number, number]
  onPositionChange: (x: number, y: number) => void
  closeComputerWindow: () => void
  createTextWindow: (title: string, content: string) => void
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
  updateCursorStyle,
  isComputerOpen,
  computerPosition,
  onPositionChange,
  closeComputerWindow,
  createTextWindow,
}: SceneProps) {
  const { camera, size } = useThree()
  
  useEffect(() => {
    camera.position.x = cameraPosition.x
    camera.position.y = cameraPosition.y
    camera.zoom = 50 * cameraZoom
    camera.updateProjectionMatrix()
    logger.info('Camera updated', { position: cameraPosition, zoom: cameraZoom });
  }, [camera, cameraPosition, cameraZoom])

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {windows.map((window) => (
        window.isReadOnly ? (
          <ReadOnlyWindow
            key={window.id}
            title={window.title}
            content={window.text}
            isReadOnly={window.isReadOnly}
            position={[window.x, window.y, 0]}
            onPositionChange={(newX, newY) => updateWindowPosition(window.id, newX, newY)}
            scale={cameraZoom}
            camera={camera}
            size={size}
            onResize={(width, height) => updateWindowSize(window.id, width, height)}
            width={window.width}
            height={window.height}
            onClose={() => removeWindow(window.id)}
          />
        ) : (
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
            scale={cameraZoom}
            creationTime={window.creationTime}
            onResize={(width, height) => updateWindowSize(window.id, width, height)}
            width={window.width}
            height={window.height}
            camera={camera}
            size={size} 
            updateCursorStyle={updateCursorStyle}
            isNew={window.isNew}
          />
        )
      ))}

      {isComputerOpen && (
        <MyComputerWindow
          position={computerPosition}
          onClose={closeComputerWindow}
          zIndex={1000}
          onMinimize={() => {}}
          onMaximize={() => {}}
          scale={1 / cameraZoom}
          onPositionChange={onPositionChange}
          camera={camera}
          size={size}
          onCreateTextWindow={createTextWindow}
          updateCursorStyle={updateCursorStyle}
        />
      )}
    </>
  )
}

const Whiteboard: React.FC = () => {
  const [windows, setWindows] = useState<Map<number, Window>>(new Map());
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 })
  const [cameraZoom, setCameraZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [cursorStyle, setCursorStyle] = useState('default')
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [colorBackground, setColorBackground] = useState(false)
  const [isComputerOpen, setIsComputerOpen] = useState(false)
  const [myComputerPosition, setMyComputerPosition] = useState<[number, number, number]>([0, 0, 0])

  useEffect(() => {
    const updateSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      logger.info('Canvas size updated', { width: window.innerWidth, height: window.innerHeight });
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

    if (windows.size > 0) {
      const lastWindow = Array.from(windows.values())[windows.size - 1]
      
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
      zIndex: windows.size,
      creationTime: new Date(),
      width: defaultWidth,
      height: defaultHeight,
      isNew: true,
      isReadOnly: false // Ensure this is set to false for new editable windows
    }
    setWindows(prevWindows => {
      const newWindows = new Map(prevWindows);
      newWindows.set(newWindow.id, newWindow);
      logger.info('New window added', { windowId: newWindow.id, title: newWindow.title });
      return newWindows;
    });
  }, [cameraPosition, cameraZoom]);

  const removeWindow = useCallback((id: number) => {
    setWindows(prevWindows => {
      const newWindows = new Map(prevWindows);
      newWindows.delete(id);
      logger.info('Window removed', { windowId: id });
      return newWindows;
    });
  }, []);

  const updateWindowText = useCallback((id: number, text: string) => {
    setWindows(prevWindows => {
      const newWindows = new Map(prevWindows);
      newWindows.set(id, { ...prevWindows.get(id)!, text });
      logger.debug('Window text updated', { windowId: id });
      return newWindows;
    });
  }, []);

  const updateWindowTitle = useCallback((id: number, title: string) => {
    setWindows(prevWindows => {
      const newWindows = new Map(prevWindows);
      newWindows.set(id, { ...prevWindows.get(id)!, title });
      logger.debug('Window title updated', { windowId: id, newTitle: title });
      return newWindows;
    });
  }, []);

  const updateWindowPosition = useCallback((id: number, newX: number, newY: number) => {
    setWindows(prevWindows => {
      const newWindows = new Map(prevWindows);
      newWindows.set(id, { ...prevWindows.get(id)!, x: newX, y: newY });
      logger.debug('Window position updated', { windowId: id, newPosition: { x: newX, y: newY } });
      return newWindows;
    });
  }, []);

  const updateWindowSize = useCallback((id: number, width: number, height: number) => {
    setWindows(prevWindows => {
      const newWindows = new Map(prevWindows);
      newWindows.set(id, { ...prevWindows.get(id)!, width, height });
      logger.debug('Window size updated', { windowId: id, newSize: { width, height } });
      return newWindows;
    });
  }, []);

  const resetView = useCallback(() => {
    setCameraPosition({ x: 0, y: 0 })
    setCameraZoom(1)
    logger.info('View reset');
  }, []);

  const updateCursorStyle = useCallback((style: string) => {
    setCursorStyle(style);
  }, []);

  const toggleColorBackground = useCallback(() => {
    setColorBackground(prev => {
      const newValue = !prev;
      logger.info('Background color toggled', { newValue });
      return newValue;
    });
  }, []);

  const openComputerWindow = () => {
    setIsComputerOpen(true);
    logger.info('Computer window opened');
  };

  const closeComputerWindow = () => {
    setIsComputerOpen(false);
    logger.info('Computer window closed');
  };

  const handleMyComputerPosition = useCallback((x: number, y: number) => {
    setMyComputerPosition([x, y, 0]);
    logger.debug('My Computer position updated', { newPosition: { x, y } });
  }, []);

  const createReadOnlyWindow = useCallback((title: string, content: string) => {
    const defaultWidth = 400;
    const defaultHeight = 320;
    const offset = 2 / (cameraZoom * 50);
  
    const newWindow: Window = { 
      id: Date.now(), 
      title: title,
      text: content, 
      x: cameraPosition.x + offset,
      y: cameraPosition.y - offset,
      zIndex: 1001, // Set this higher than the MyComputerWindow zIndex
      creationTime: new Date(),
      width: defaultWidth,
      height: defaultHeight,
      isNew: false,
      isReadOnly: true // Ensure this is set to true for read-only windows
    };
    setWindows(prevWindows => {
      const newWindows = new Map(prevWindows);
      newWindows.set(newWindow.id, newWindow);
      logger.info('Read-only window created', { windowId: newWindow.id, title: newWindow.title });
      return newWindows;
    });
  }, [cameraPosition, cameraZoom]);

  return (
    <main className={styles.whiteboard} style={{ cursor: cursorStyle }}>
      {/* Background */}
      {colorBackground ? (
        <div className={styles.colorBackground} aria-hidden="true" />
      ) : (
        <div className={styles.cloudBackground} aria-hidden="true" />
      )}

      {/* Panel - Update the props passed to Panel */}
      <div className="absolute left-4 top-4 z-50">
        <Panel
          windowCount={windows.size}
          x={cameraPosition.x}
          y={cameraPosition.y}
          scale={cameraZoom}
          onAddWindow={addWindow}
          onResetView={resetView}
          colorBackground={colorBackground}
          toggleColorBackground={toggleColorBackground}
          updateCursorStyle={updateCursorStyle}
          createTextWindow={createReadOnlyWindow}
          size={canvasSize}
          openComputerWindow={openComputerWindow} // Pass this prop
        />
      </div>

      {/* R3F Canvas */}
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
          windows={Array.from(windows.values())}
          updateWindowPosition={updateWindowPosition}
          removeWindow={removeWindow}
          updateWindowText={updateWindowText}
          updateWindowTitle={updateWindowTitle}
          updateWindowSize={updateWindowSize}
          cameraPosition={cameraPosition}
          cameraZoom={cameraZoom}
          updateCursorStyle={updateCursorStyle}
          isComputerOpen={isComputerOpen}
          computerPosition={myComputerPosition}
          onPositionChange={handleMyComputerPosition}
          closeComputerWindow={closeComputerWindow}
          createTextWindow={createReadOnlyWindow}
        />
      </Canvas>

      {/* Remove the My Computer icon from here */}
    </main>
  );
};

export default Whiteboard;
