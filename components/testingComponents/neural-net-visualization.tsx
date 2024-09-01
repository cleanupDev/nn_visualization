'use client'

import React from 'react'
import { Canvas } from '@react-three/fiber'
import { NeuralNetController } from './neuralNetController'
import NeuralNetwork from './neural-network'
import CameraController from './camera-controller'

export default function NeuralNetVisualization({ children, controller }: { children: React.ReactNode; controller: NeuralNetController }) {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <color attach="background" args={['#121212']} />
        <NeuralNetwork controller={controller} />
        <CameraController />
      </Canvas>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          {children}
        </div>
      </div>
    </div>
  )
}