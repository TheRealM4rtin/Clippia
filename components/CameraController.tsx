import React, { useEffect, useCallback, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useAppStore } from '@/lib/store'

const CameraController: React.FC = () => {
  const { camera, gl } = useThree()
  const { position, scale, setPosition, setScale } = useAppStore()

  const handleWheel = useCallback((event: WheelEvent) => {
    if (event.altKey) {
      event.preventDefault()
      const zoomSpeed = 0.1
      const newScale = Math.max(0.1, scale + (event.deltaY > 0 ? -zoomSpeed : zoomSpeed))
      setScale(newScale)
    }
  }, [scale, setScale])

  useEffect(() => {
    gl.domElement.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      gl.domElement.removeEventListener('wheel', handleWheel)
    }
  }, [gl.domElement, handleWheel])

  useEffect(() => {
    camera.position.x = position.x
    camera.position.y = position.y
    camera.zoom = 50 * scale
    camera.updateProjectionMatrix()
  }, [camera, position, scale])

  return null
}

export default CameraController
