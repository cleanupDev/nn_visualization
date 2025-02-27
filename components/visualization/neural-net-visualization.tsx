'use client'

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import CameraController from './camera-controller'
import NeuralNetwork from './neural-network'
import { SceneControls } from '../scene-controls'
import { useModelStore } from '../store'
import useMediaQuery from '../hooks/use-media-query'

// Performance settings for different types of networks
const getPerformanceSettings = (dataset: string | null) => {
  // High performance mode for MNIST dataset which has many neurons and connections
  if (dataset === 'mnist') {
    return {
      frameLoopMode: 'demand' as const, // Only render when needed
      dpr: [0.8, 1.2] as [number, number],  // Lower pixel ratio for even better performance
      frameRate: 20,                      // Lower frame rate
      precision: 'lowp' as const,        // Lower precision for better performance
      useFlat: true,                     // Flat shading
      gl2: false,                        // No WebGL2 features 
      shadowsEnabled: false              // Disable shadows
    }
  }
  
  // Medium performance mode for medium-sized networks
  return {
    frameLoopMode: 'always' as const,   // Always render
    dpr: [1, 2] as [number, number],    // Higher pixel ratio
    precision: 'highp' as const,        // High precision
    useFlat: false,                     // No flat shading
    gl2: true,                         // Use WebGL2 features
    shadowsEnabled: true                // Enable shadows
  }
}

// Memoized component to manage render throttling for performance
const FrameRateManager = React.memo(({ dataset }: { dataset: string | null }) => {
  const frameCountRef = useRef(0)
  const lastRenderTimeRef = useRef(0)
  const skipFramesRef = useRef(false)
  
  // Calculate frame rate based on dataset - memoized to avoid recalculation
  const targetFrameInterval = useMemo(() => {
    if (dataset === 'mnist') return 1000/20  // 20 FPS for MNIST
    if (dataset === 'sine' && window.innerWidth < 768) return 1000/30  // 30 FPS for sine on mobile
    return 1000/60  // 60 FPS otherwise
  }, [dataset])
  
  useFrame(({ gl, scene, camera }) => {
    const now = performance.now()
    const elapsed = now - lastRenderTimeRef.current
    
    // Skip frames based on dataset and frame rate
    if (dataset === 'mnist') {
      frameCountRef.current++
      
      // Only render every X milliseconds for performance
      if (elapsed < targetFrameInterval) {
        return
      }
      
      // For large networks, aggressively skip frames to improve performance
      // Skip 2 out of 3 frames for MNIST
      skipFramesRef.current = !skipFramesRef.current
      if (skipFramesRef.current) {
        return
      }
    } else if (elapsed < targetFrameInterval) {
      // For all other datasets, still respect the target frame rate
      return
    }
    
    // Update render time
    lastRenderTimeRef.current = now
    
    // Force render
    gl.render(scene, camera)
  })
  
  return null
})

// Set display name for debugging
FrameRateManager.displayName = 'FrameRateManager'

// Main visualization component - memoized for performance
const NeuralNetVisualization = React.memo(({ children }: { children: React.ReactNode }) => {
  // Use selective state subscriptions instead of destructuring the whole store
  const cameraType = useModelStore(state => state.cameraType)
  const selectedDataset = useModelStore(state => state.selectedDataset)
  const mediaQueryMatch = useMediaQuery("(min-width: 768px)")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  // Listen for sidebar toggle events from the sidebar component
  useEffect(() => {
    const handleSidebarToggle = (e: CustomEvent) => {
      setIsSidebarOpen(e.detail.isOpen)
    }
    
    window.addEventListener('sidebar-toggle' as any, handleSidebarToggle)
    return () => {
      window.removeEventListener('sidebar-toggle' as any, handleSidebarToggle)
    }
  }, [])
  
  // Get performance settings based on dataset - memoized to avoid recalculation
  const perfSettings = useMemo(() => 
    getPerformanceSettings(selectedDataset), 
    [selectedDataset]
  )
  
  // Safe check for selectedDataset
  const datasetKey = selectedDataset || 'default'
  
  // Calculate camera position and settings only when necessary
  const cameraSettings = useMemo(() => {
    const baseSettings = {
      position: cameraType === 'orthographic' ? [5, 5, 15] as [number, number, number] : [0, 0, 10] as [number, number, number],
      type: cameraType === 'orthographic' ? 'OrthographicCamera' : 'PerspectiveCamera'
    }
    
    if (cameraType === 'orthographic') {
      return {
        ...baseSettings,
        zoom: 3,
        near: 0.1,
        far: 1000,
        left: -40,
        right: 40,
        top: 40,
        bottom: -40
      }
    }
    
    return {
      ...baseSettings,
      fov: 50,
      near: 0.1,
      far: 1000
    }
  }, [cameraType])
  
  // Calculate GL properties only when necessary
  const glProperties = useMemo(() => ({
    antialias: selectedDataset !== 'mnist', // Disable antialiasing for MNIST
    alpha: true,
    logarithmicDepthBuffer: false, // Disable logarithmic depth buffer for performance
    powerPreference: 'high-performance',
    precision: perfSettings.precision
  }), [selectedDataset, perfSettings.precision])

  return (
    <div className="fixed inset-0 z-0">
      <Canvas 
        key={`camera-${cameraType}-${datasetKey}`}
        camera={cameraSettings}
        gl={glProperties}
        frameloop={perfSettings.frameLoopMode}
        dpr={perfSettings.dpr}
        performance={{ min: 0.5 }}
        style={{ touchAction: 'none' }} // Improve touch performance on mobile
      >
        <color attach="background" args={['#030712']} />
        <fog attach="fog" args={['#030712', 30, 60]} />
        
        {/* Reduce light complexity for MNIST */}
        <ambientLight intensity={0.4} />
        {selectedDataset !== 'mnist' ? (
          <>
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={0.9}
              color="#ffffff" 
              castShadow={perfSettings.shadowsEnabled}
            />
            <directionalLight 
              position={[-8, -5, -2]} 
              intensity={0.3} 
              color="#5865f2" 
            />
            <pointLight
              position={[0, 0, 10]}
              intensity={0.4}
              color="#ffffff"
              distance={50}
            />
          </>
        ) : (
          // Simplified lighting for MNIST
          <directionalLight 
            position={[0, 10, 10]} 
            intensity={0.9}
            color="#ffffff" 
          />
        )}
        
        {/* Only use environment for smaller networks */}
        {selectedDataset !== 'mnist' && perfSettings.shadowsEnabled && (
          <Environment preset="night" background={false} />
        )}
        
        <NeuralNetwork />
        <CameraController />
        
        {/* Frame rate management for performance */}
        <FrameRateManager dataset={datasetKey} />
      </Canvas>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          {children}
        </div>
      </div>
      <SceneControls isSidebarOpen={isSidebarOpen} />
    </div>
  )
})

// Set display name for debugging
NeuralNetVisualization.displayName = 'NeuralNetVisualization'

export default NeuralNetVisualization