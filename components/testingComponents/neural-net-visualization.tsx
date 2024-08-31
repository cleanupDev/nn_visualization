'use client'

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Line } from '@react-three/drei'
import { Color, Vector3, Plane, Raycaster, MeshBasicMaterial, ShaderMaterial, Uniform } from 'three'
import { useSpring, animated } from '@react-spring/three'

// Define the structure of our neural network
const layers = [3, 4, 4, 2] // Input layer, two hidden layers, output layer

// Helper function to create neuron data
const createNeuronData = () => {
  const data: { position: Vector3; activation: number }[] = []
  const spacing = 2
  const totalLayers = layers.length

  layers.forEach((neurons, layerIndex) => {
    const layerOffset = (totalLayers - 1) / 2 - layerIndex
    for (let i = 0; i < neurons; i++) {
      const verticalOffset = (neurons - 1) / 2 - i
      data.push({
        position: new Vector3(layerOffset * spacing, verticalOffset * spacing, 0),
        activation: Math.random(), // Random activation between 0 and 1
      })
    }
  })

  return data
}

// Component for a single neuron
const Neuron = ({ position, defaultPosition, activation, onDrag, isRealigning }: { position: Vector3; defaultPosition: Vector3; activation: number; onDrag: (position: Vector3) => void; isRealigning: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera, raycaster, mouse } = useThree()
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])

  const { animatedPosition } = useSpring({
    animatedPosition: isRealigning ? [defaultPosition.x, defaultPosition.y, defaultPosition.z] : [position.x, position.y, position.z],
    config: { mass: 1, tension: 180, friction: 12 }
  })

  const color = useMemo(() => {
    return new Color().setHSL(0.6 - activation * 0.5, 1, 0.5)
  }, [activation])

  const hoverColor = useMemo(() => {
    return color.clone().lerp(new Color(1, 1, 1), 0.5)
  }, [color])

  const onPointerDown = useCallback((event: THREE.Event) => {
    event.stopPropagation()
    setIsDragging(true)
  }, [])

  const onPointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const onPointerMove = useCallback((event: THREE.Event) => {
    if (isDragging) {
      raycaster.setFromCamera(mouse, camera)
      const intersectionPoint = new Vector3()
      if (raycaster.ray.intersectPlane(dragPlane, intersectionPoint)) {
        onDrag(intersectionPoint)
      }
    }
  }, [isDragging, camera, mouse, dragPlane, onDrag, raycaster])

  const onPointerEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const onPointerLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const onClick = useCallback(() => {
    console.log('Neuron clicked')
    // Placeholder for future functionality
  }, [])

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(position)
      meshRef.current.scale.setScalar(isHovered ? 1.2 : 1)
    }
  })

  return (
    <animated.mesh
      ref={meshRef}
      position={animatedPosition}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color={isHovered ? hoverColor : color} />
    </animated.mesh>
  )
}

// Component for connections between neurons
const Connection = ({ start, end, strength }: { start: Vector3; end: Vector3; strength: number }) => {
  const color = useMemo(() => {
    return new Color().setHSL(0.6 - strength * 0.5, 1, 0.5)
  }, [strength])

  return (
    <Line
      points={[start, end]}
      color={color}
      lineWidth={strength * 5}
      onClick={() => console.log('Connection clicked')}
    />
  )
}

// Component for all connections
const Connections = ({ neurons }: { neurons: { position: Vector3; activation: number }[] }) => {
  const connections = useMemo(() => {
    const result = []
    let currentIndex = 0

    for (let i = 0; i < layers.length - 1; i++) {
      for (let j = 0; j < layers[i]; j++) {
        const startNeuronIndex = currentIndex + j
        for (let k = 0; k < layers[i + 1]; k++) {
          const endNeuronIndex = currentIndex + layers[i] + k
          if (startNeuronIndex < neurons.length && endNeuronIndex < neurons.length) {
            const startNeuron = neurons[startNeuronIndex]
            const endNeuron = neurons[endNeuronIndex]
            const strength = (startNeuron.activation + endNeuron.activation) / 2
            result.push(
              <Connection
                key={`${i}-${j}-${k}`}
                start={startNeuron.position}
                end={endNeuron.position}
                strength={strength}
              />
            )
          }
        }
      }
      currentIndex += layers[i]
    }

    return result
  }, [neurons])

  return <>{connections}</>
}

// Main component for the neural network visualization
const NeuralNetwork = () => {
  const [neurons, setNeurons] = useState(() => createNeuronData())
  const [isRealigning, setIsRealigning] = useState(false)
  const defaultNeurons = useRef(neurons)

  const updateNeuronPosition = useCallback((index: number, newPosition: Vector3) => {
    setNeurons(prevNeurons => {
      if (index >= 0 && index < prevNeurons.length) {
        const updatedNeurons = [...prevNeurons]
        updatedNeurons[index] = { ...updatedNeurons[index], position: newPosition }
        return updatedNeurons
      }
      return prevNeurons
    })
  }, [])

  const startRealignment = useCallback(() => {
    setIsRealigning(true)
  }, [])

  const stopRealignment = useCallback(() => {
    setIsRealigning(false)
  }, [])

  useEffect(() => {
    const handlePointerUp = () => {
      startRealignment()
    }

    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [startRealignment])

  useEffect(() => {
    if (isRealigning) {
      const timer = setTimeout(() => {
        setNeurons(defaultNeurons.current)
        stopRealignment()
      }, 300) // Adjust this delay as needed
      return () => clearTimeout(timer)
    }
  }, [isRealigning, stopRealignment])

  return (
    <>
      {neurons.map((neuron, index) => (
        <Neuron
          key={index}
          position={neuron.position}
          defaultPosition={defaultNeurons.current[index].position}
          activation={neuron.activation}
          onDrag={(newPosition) => updateNeuronPosition(index, newPosition)}
          isRealigning={isRealigning}
        />
      ))}
      <Connections neurons={neurons} />
    </>
  )
}

const CameraController = () => {
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

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false)
      api.start({
        cameraPosition: [defaultCameraPosition.x, defaultCameraPosition.y, defaultCameraPosition.z],
        cameraRotation: [defaultCameraRotation.x, defaultCameraRotation.y, defaultCameraRotation.z],
      })
    }
  }

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
      enableZoom={false}
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

// Wrapper component that sets up the Three.js scene
const NeuralNetVisualization = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <color attach="background" args={['#121212']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <NeuralNetwork />
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

export default NeuralNetVisualization