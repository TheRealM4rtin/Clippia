import React, { useRef, useEffect, useCallback } from 'react'
import { useThree } from '@react-three/fiber'

interface CameraControllerProps {
  cameraPosition: { x: number; y: number }
  setCameraPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  cameraZoom: number
  setCameraZoom: React.Dispatch<React.SetStateAction<number>>
  isPanning: boolean
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>
  updateCursorStyle: (style: string) => void
}

const CameraController: React.FC<CameraControllerProps> = ({
  cameraPosition,
  setCameraPosition,
  cameraZoom,
  setCameraZoom,
  isPanning,
  setIsPanning,
  updateCursorStyle,
}) => {
  const { camera, gl } = useThree()
  const lastMousePosition = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (target === gl.domElement) {
      setIsPanning(true)
      lastMousePosition.current = { x: event.clientX, y: event.clientY }
      updateCursorStyle('grab')
    }
  }, [gl.domElement, setIsPanning, updateCursorStyle])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isPanning) {
      const deltaX = event.clientX - lastMousePosition.current.x
      const deltaY = event.clientY - lastMousePosition.current.y
      setCameraPosition(prev => ({
        x: prev.x - deltaX / (cameraZoom * 50),
        y: prev.y + deltaY / (cameraZoom * 50)
      }))
      lastMousePosition.current = { x: event.clientX, y: event.clientY }
    }
  }, [isPanning, cameraZoom, setCameraPosition])

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
      updateCursorStyle('default')
    }
  }, [isPanning, setIsPanning, updateCursorStyle])

  const handleMouseLeave = useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
      updateCursorStyle('default')
    }
  }, [isPanning, setIsPanning, updateCursorStyle])

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault()
    const zoomSpeed = 0.1
    const delta = event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed
    setCameraZoom(prev => Math.max(0.1, Math.min(10, prev * delta)))
  }, [setCameraZoom])

  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [gl.domElement, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleWheel])

  useEffect(() => {
    camera.position.x = cameraPosition.x
    camera.position.y = cameraPosition.y
    camera.zoom = 50 * cameraZoom
    camera.updateProjectionMatrix()
  }, [camera, cameraPosition, cameraZoom])

  return null
}

export default CameraController
