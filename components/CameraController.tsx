import React, { useEffect, useCallback, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useAppStore } from '@/lib/store'

const CameraController: React.FC = () => {
  const { camera, gl } = useThree()
  const { position, scale, setPosition, setScale } = useAppStore()
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button === 1 || (event.button === 0 && event.altKey)) {
      setIsDragging(true)
      setLastMousePosition({ x: event.clientX, y: event.clientY })
    }
  }, [])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging) {
      const deltaX = event.clientX - lastMousePosition.x
      const deltaY = event.clientY - lastMousePosition.y
      setPosition({
        x: position.x - deltaX / (scale * 50),
        y: position.y + deltaY / (scale * 50)
      })
      setLastMousePosition({ x: event.clientX, y: event.clientY })
    }
  }, [isDragging, lastMousePosition, position, scale, setPosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault()
    const zoomSpeed = 0.1
    const newScale = Math.max(0.1, scale + (event.deltaY > 0 ? -zoomSpeed : zoomSpeed))
    setScale(newScale)
  }, [scale, setScale])

  useEffect(() => {
    gl.domElement.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    gl.domElement.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      gl.domElement.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      gl.domElement.removeEventListener('wheel', handleWheel)
    }
  }, [gl.domElement, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel])

  useEffect(() => {
    camera.position.x = position.x
    camera.position.y = position.y
    camera.zoom = 50 * scale
    camera.updateProjectionMatrix()
  }, [camera, position, scale])

  return null
}

export default CameraController
