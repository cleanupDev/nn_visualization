'use client'

import React, { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import NeuralNetwork from './neural-network'
import CameraController from './camera-controller'
import { SceneControls } from '@/components/scene-controls'
import { useModelStore } from '@/components/store'

export default function NeuralNetVisualization({ children }: { children: React.ReactNode }) {
  const { cameraType } = useModelStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (e: CustomEvent) => {
      setIsSidebarOpen(e.detail.isOpen);
    };
    
    window.addEventListener('sidebar-toggle' as any, handleSidebarToggle);
    return () => {
      window.removeEventListener('sidebar-toggle' as any, handleSidebarToggle);
    };
  }, []);
  
  return (
    <div className="fixed inset-0 z-0">
      <Canvas 
        camera={{ 
          position: [0, 0, 10], 
          fov: 50,
          type: cameraType === 'orthographic' ? 'OrthographicCamera' : 'PerspectiveCamera'
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          logarithmicDepthBuffer: true
        }}
      >
        <color attach="background" args={['#030712']} />
        <fog attach="fog" args={['#030712', 15, 40]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <NeuralNetwork />
        <CameraController />
      </Canvas>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          {children}
        </div>
      </div>
      <SceneControls isSidebarOpen={isSidebarOpen} />
    </div>
  )
}