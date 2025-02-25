import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Vector3, PerspectiveCamera, OrthographicCamera } from 'three'
import { useSpring } from '@react-spring/three'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useModelStore } from '@/components/store'

export default function CameraController() {
  const { camera, gl, invalidate } = useThree()
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { cameraType } = useModelStore()
  
  // Define starting positions for each camera type
  const defaultCameraPosition = useMemo(() => {
    return cameraType === 'orthographic' 
      ? new Vector3(5, 5, 15) // Match the position in neural-net-visualization
      : new Vector3(0, 0, 10)
  }, [cameraType])
  
  const defaultCameraRotation = useMemo(() => new Vector3(0, 0, 0), [])

  const [{ cameraPosition, cameraRotation }, api] = useSpring(() => ({
    cameraPosition: cameraType === 'orthographic' 
      ? [5, 5, 15] 
      : [0, 0, 10],
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
    
    console.log("Resetting camera for type:", cameraType);
    
    // Reset camera to default position with animation
    api.start({
      cameraPosition: [defaultCameraPosition.x, defaultCameraPosition.y, defaultCameraPosition.z],
      cameraRotation: [defaultCameraRotation.x, defaultCameraRotation.y, defaultCameraRotation.z],
    })
    
    // Also reset the orbit controls
    if (controlsRef.current) {
      // Reset controls to default view
      controlsRef.current.reset();
      
      // For orthographic camera, use specific settings
      if (cameraType === 'orthographic' && camera.type === 'OrthographicCamera') {
        const orthoCam = camera as OrthographicCamera;
        
        // Ensure zoom level is reset
        orthoCam.zoom = 3;
        orthoCam.updateProjectionMatrix();
        
        // Log current camera state after reset
        console.log("After reset - Ortho Camera position:", camera.position);
        console.log("After reset - Ortho Camera zoom:", orthoCam.zoom);
      }
    }
    
    // Force a render update
    invalidate();
    
  }, [api, defaultCameraPosition, defaultCameraRotation, camera, cameraType, invalidate])

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
  
  // Apply camera-specific settings when the controller is mounted
  useEffect(() => {
    console.log("Camera controller mounted, camera type:", cameraType);
    console.log("Camera object type:", camera.type);
    
    if (camera.type === 'OrthographicCamera') {
      const orthoCam = camera as OrthographicCamera;
      // Make sure the orthographic camera has appropriate settings
      orthoCam.zoom = 3;
      orthoCam.left = -40;
      orthoCam.right = 40;
      orthoCam.top = 40;
      orthoCam.bottom = -40;
      orthoCam.position.set(5, 5, 15);
      orthoCam.lookAt(0, 0, 0);
      orthoCam.updateProjectionMatrix();
      console.log("Applied orthographic camera settings:", orthoCam);
      console.log("Ortho camera position:", orthoCam.position);
      console.log("Ortho camera zoom:", orthoCam.zoom);
    } else if (camera.type === 'PerspectiveCamera') {
      const perspCam = camera as PerspectiveCamera;
      perspCam.fov = 50;
      perspCam.position.set(0, 0, 10);
      perspCam.lookAt(0, 0, 0);
      perspCam.updateProjectionMatrix();
      console.log("Applied perspective camera settings:", perspCam);
    }
    
    // Force a render to apply changes
    invalidate();
    
    // Automatically reset camera after a small delay to ensure proper initialization
    const timer = setTimeout(() => {
      resetCamera();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [camera, cameraType, invalidate, resetCamera]);

  // Camera controls configuration based on camera type
  const controlsConfig = useMemo(() => {
    if (cameraType === 'orthographic') {
      return {
        enableZoom: true,
        enableRotate: true,
        enablePan: true,
        panSpeed: 0.7,
        zoomSpeed: 0.5,
        rotateSpeed: 0.5,
        minZoom: 1,
        maxZoom: 20
      };
    } else {
      return {
        enableZoom: true,
        enableRotate: true,
        enablePan: true,
        panSpeed: 0.7,
        zoomSpeed: 0.8,
        rotateSpeed: 0.8,
        minDistance: 3,
        maxDistance: 20
      };
    }
  }, [cameraType]);

  return (
    <OrbitControls
      ref={controlsRef}
      {...controlsConfig}
      target={[0, 0, 0]} // Ensure we're always looking at the center
      enableDamping={true}
      dampingFactor={0.1}
      onChange={() => {
        if (isDragging) {
          api.set({
            cameraPosition: [camera.position.x, camera.position.y, camera.position.z],
            cameraRotation: [camera.rotation.x, camera.rotation.y, camera.rotation.z],
          })
        }
      }}
      makeDefault
    />
  )
}