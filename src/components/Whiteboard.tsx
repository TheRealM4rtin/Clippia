import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import TextWindow from './TextWindow'
import DebugPanel from './DebugPanel'
import { format } from 'date-fns';

interface Window {
  id: number
  title: string
  text: string
  x: number
  y: number
  zIndex: number
  creationTime: Date;
  width: number
  height: number
}

function Scene({ 
  windows, 
  updateWindowPosition, 
  removeWindow, 
  updateWindowText,
  updateWindowTitle, 
  updateWindowSize,
  cameraPosition,
  cameraZoom
}) {
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
          cameraZoom={cameraZoom}
          creationTime={window.creationTime}
          onResize={(width, height) => updateWindowSize(window.id, width, height)}
          width={window.width}
          height={window.height}
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
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [cursorStyle, setCursorStyle] = useState('default')

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target === overlayRef.current || !target.closest('.window')) {
      setIsPanning(true)
      setLastMousePosition({ x: event.clientX, y: event.clientY })
      setCursorStyle('move')
    }
  }, [])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = event.clientX - lastMousePosition.x
      const deltaY = event.clientY - lastMousePosition.y
      setCameraPosition(prev => ({
        x: prev.x - deltaX / (cameraZoom * 50),
        y: prev.y + deltaY / (cameraZoom * 50)
      }))
      setLastMousePosition({ x: event.clientX, y: event.clientY })
    }
  }, [isPanning, lastMousePosition, cameraZoom])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    setCursorStyle('default')
  }, [])

  const handleOverlayMouseDown = useCallback((event: React.MouseEvent) => {
    // Prevent event from propagating to TextWindow components
    event.stopPropagation()
    handleMouseDown(event)
  }, [handleMouseDown])

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault()
    const zoomSpeed = 0.1
    const delta = event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed
    setCameraZoom(prev => Math.max(0.1, Math.min(10, prev * delta)))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false })
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel)
      }
    }
  }, [handleWheel])

  const addWindow = useCallback(() => {
    const offset = 5 // Offset for new window position
    let newX, newY

    if (windows.length > 0) {
      // Get the position of the last window
      const lastWindow = windows[windows.length - 1]
      newX = lastWindow.x + offset
      newY = lastWindow.y + offset
    } else {
      // If it's the first window, create it at the center of the view
      newX = -cameraPosition.x
      newY = -cameraPosition.y
    }

    const newWindow = { 
      id: Date.now(), 
      title: 'New Window',
      text: 'New Window Content', 
      x: newX,
      y: newY,
      zIndex: windows.length,
      creationTime: new Date(),
      width: 400, // Default width
      height: 320, // Default height
    }
    setWindows(prevWindows => [...prevWindows, newWindow])
  }, [windows, cameraPosition])

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
    console.log('Updating window size', id, width, height);
    setWindows(prevWindows =>
      prevWindows.map(window =>
        window.id === id ? { ...window, width, height } : window
      )
    );
  }, [])

  const resetView = useCallback(() => {
    setCameraPosition({ x: 0, y: 0 })
    setCameraZoom(1)
  }, [])

  return (
    <div 
      ref={canvasRef}
      className="relative w-screen h-screen overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: cursorStyle }}
    >
      <Canvas
        orthographic
        camera={{ zoom: 50, position: [0, 0, 100] }}
        dpr={window.devicePixelRatio}
        gl={{ antialias: true }}
      >
        <Scene
          windows={windows}
          updateWindowPosition={updateWindowPosition}
          removeWindow={removeWindow}
          updateWindowText={updateWindowText}
          updateWindowTitle={updateWindowTitle}
          updateWindowSize={updateWindowSize}
          cameraPosition={cameraPosition}
          cameraZoom={cameraZoom}
        />
      </Canvas>
      <div 
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{ 
          touchAction: 'none',
          zIndex: 1
        }}
      />
      <DebugPanel
        windowCount={windows.length}
        x={cameraPosition.x}
        y={cameraPosition.y}
        scale={cameraZoom}
        onAddWindow={addWindow}
        onResetView={resetView}
      />
    </div>
  )
}

export default Whiteboard
