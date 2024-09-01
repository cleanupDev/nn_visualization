import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useSpring } from '@react-spring/three'
import { OrbitControls } from '@react-three/drei'

export default function CameraController() {
  const { camera, gl } = useThree()
  const controlsRef = useRef<OrbitControls>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const defaultCameraPosition = useMemo(() => new Vector3(0, 0, 10), [])
  const defaultCameraRotation = useMemo(() => new Vector3(0, 0, 0), [])

  const [{ cameraPosition, cameraRotation }, api] = useSpring(() => ({
    cameraPosition: [0, 0, 10],
    cameraRotation: [0, 0, 0],
    config: { mass: 1, tension: 280, friction: 120 }
  }))

  const handlePointerDown = () => {
    setIsDragging(true)
  }

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      api.start({
        cameraPosition: [defaultCameraPosition.x, defaultCameraPosition.y, defaultCameraPosition.z],
        cameraRotation: [defaultCameraRotation.x, defaultCameraRotation.y, defaultCameraRotation.z],
      })
    }
  }, [isDragging, api, defaultCameraPosition, defaultCameraRotation])

  useFrame(() => {
    if (!isDragging) {
      camera.position.set(cameraPosition.get()[0], cameraPosition.get()[1], cameraPosition.get()[2])
      camera.rotation.set(cameraRotation.get()[0], cameraRotation.get()[1], cameraRotation.get()[2])
    }
  })

  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointerup', handlePointerUp)
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointerup', handlePointerUp)
    }
  }, [gl, handlePointerDown, handlePointerUp])

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      enableDamping={false}
      onChange={() => {
        if (isDragging) {
          api.set({
            cameraPosition: [camera.position.x, camera.position.y, camera.position.z],
            cameraRotation: [camera.rotation.x, camera.rotation.y, camera.rotation.z],
          })
        }
      }}
    />
  )
}