'use client'

import React, { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import NeuralNetwork from './neural-network'
import CameraController from './camera-controller'
import { Environment } from '@react-three/drei'
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
        key={`camera-${cameraType}`}
        camera={{ 
          position: cameraType === 'orthographic' ? [5, 5, 15] : [0, 0, 10],
          type: cameraType === 'orthographic' ? 'OrthographicCamera' : 'PerspectiveCamera',
          ...(cameraType === 'orthographic' 
            ? {
                zoom: 3,
                near: 0.1,
                far: 1000,
                left: -40,
                right: 40,
                top: 40,
                bottom: -40
              } 
            : {
                fov: 50,
                near: 0.1,
                far: 1000
              })
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          logarithmicDepthBuffer: true
        }}
      >
        <color attach="background" args={['#030712']} />
        <fog attach="fog" args={['#030712', 30, 60]} />
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={0.9}
          color="#ffffff" 
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
        
        {/* Add environment map for reflections on materials */}
        <Environment preset="night" background={false} />
        
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