import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useSpring } from '@react-spring/three'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useModelStore } from '@/components/store'

export default function CameraController() {
  const { camera, gl } = useThree()
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { cameraType } = useModelStore()
  
  const defaultCameraPosition = useMemo(() => new Vector3(0, 0, 10), [])
  const defaultCameraRotation = useMemo(() => new Vector3(0, 0, 0), [])

  const [{ cameraPosition, cameraRotation }, api] = useSpring(() => ({
    cameraPosition: [0, 0, 10],
    cameraRotation: [0, 0, 0],
    config: { mass: 1, tension: 280, friction: 120 }
  }))

  const handlePointerDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
    }
  }, [isDragging])
  
  const resetCamera = useCallback(() => {
    setIsDragging(false)
    
    // Reset camera to default position with animation
    api.start({
      cameraPosition: [defaultCameraPosition.x, defaultCameraPosition.y, defaultCameraPosition.z],
      cameraRotation: [defaultCameraRotation.x, defaultCameraRotation.y, defaultCameraRotation.z],
    })
    
    // Also reset the orbit controls
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [api, defaultCameraPosition, defaultCameraRotation])

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
    
    // Listen for reset camera event
    const handleResetCamera = () => resetCamera();
    window.addEventListener('reset-camera', handleResetCamera);
    
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('reset-camera', handleResetCamera);
    }
  }, [gl, handlePointerDown, handlePointerUp, resetCamera])
  
  // Update camera when camera type changes
  useEffect(() => {
    if (cameraType === 'orthographic') {
      camera.position.z = 15; // Move orthographic camera a bit further back
      if (camera.type === 'OrthographicCamera') {
        (camera as any).zoom = 50;
        camera.updateProjectionMatrix();
      }
    } else {
      camera.position.z = 10;
      if (camera.type === 'PerspectiveCamera') {
        (camera as any).fov = 50;
        camera.updateProjectionMatrix();
      }
    }
  }, [camera, cameraType]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      enableDamping={true}
      dampingFactor={0.1}
      rotateSpeed={0.8}
      zoomSpeed={0.8}
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