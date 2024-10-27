import React, { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useAppStore } from '@/lib/store'
import TextWindow from '@/components/TextWindow'
import MyComputerWindow from '@/components/MyComputerWindow'
import Panel from '@/components/Panel'
import CameraController from '@/components/CameraController'
import styles from './whiteboard.module.css'

const Whiteboard: React.FC = () => {
  const { windows, colorBackground, setViewportSize, viewportSize } = useAppStore()

  useEffect(() => {
    const updateSize = () => {
      const newSize = { width: window.innerWidth, height: window.innerHeight };
      console.log('Viewport size updated:', newSize);
      setViewportSize(newSize)
    }
    window.addEventListener('resize', updateSize)
    updateSize()
    return () => window.removeEventListener('resize', updateSize)
  }, [setViewportSize])

  useEffect(() => {
    console.log('Windows updated:', windows);
  }, [windows]);

  return (
    <main className={styles.whiteboard}>
      <div className={colorBackground ? styles.colorBackground : styles.cloudBackground} aria-hidden="true" />
      <div className={styles.canvasContainer}>
        <Canvas
          orthographic
          camera={{ zoom: 50, position: [0, 0, 100], near: 0.1, far: 1000 }}
          dpr={window.devicePixelRatio}
          className={styles.canvas}
        >
          <CameraController />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
        </Canvas>
      </div>
      <div className={styles.panelContainer}>
        <Panel />
      </div>
      <div className={styles.windowsContainer}>
        {windows.map((window) => {
          if (window.type === 'text') {
            return <TextWindow key={window.id} window={window} />;
          } else if (window.type === 'myComputer') {
            return <MyComputerWindow key={window.id} window={window} viewportSize={viewportSize} />;
          } else {
            console.warn(`Unknown window type: ${window.type}`);
            return null;
          }
        })}
      </div>
    </main>
  )
}

export default Whiteboard
