'use client'

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import { Color, Vector3, Plane, Raycaster } from 'three'
import { useSpring, animated, config } from '@react-spring/three'
import { NeuralNetController, Neuron as NeuronType, Connection as ConnectionType } from './neuralNetController'
import { MeshBasicMaterial } from 'three'

// Component for a single neuron
const Neuron = ({ neuron, onDrag, isRealigning }: { neuron: NeuronType; onDrag: (position: Vector3) => void; isRealigning: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera, raycaster, mouse } = useThree()
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])

  const { animatedPosition } = useSpring({
    animatedPosition: isRealigning ? [neuron.position.x, neuron.position.y, neuron.position.z] : [neuron.position.x, neuron.position.y, neuron.position.z],
    config: { mass: 1, tension: 180, friction: 12 }
  })

  const neuronColor = useMemo(() => new Color('#1971c2'), [])
  const hoverColor = useMemo(() => neuronColor.clone().lerp(new Color(1, 1, 1), 0.3), [neuronColor])

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
      meshRef.current.position.copy(neuron.position)
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
      <meshBasicMaterial color={isHovered ? hoverColor : neuronColor} />
    </animated.mesh>
  )
}

// Component for connections between neurons
const Connection = ({ connection, neurons }: { connection: ConnectionType; neurons: NeuronType[] }) => {
  const startNeuron = neurons.find(n => n.id === connection.startNeuronId)
  const endNeuron = neurons.find(n => n.id === connection.endNeuronId)

  if (!startNeuron || !endNeuron) {
    return null
  }

  const color = useMemo(() => {
    return connection.strength >= 0 ? new Color('#2f9e44') : new Color('#e03131')
  }, [connection.strength])

  return (
    <Line
      points={[startNeuron.position, endNeuron.position]}
      color={color}
      lineWidth={Math.abs(connection.strength) * 5}
      onClick={() => console.log('Connection clicked')}
    />
  )
}

// Main component for the neural network visualization
const NeuralNetwork = ({ controller }: { controller: NeuralNetController }) => {
  const [neurons, setNeurons] = useState(controller.getNeurons());
  const [connections, setConnections] = useState(controller.getConnections());

  const updateVisualization = useCallback(() => {
    console.log("Updating visualization");
    const updatedNeurons = controller.getNeurons();
    const updatedConnections = controller.getConnections();
    console.log("Updated neurons:", updatedNeurons);
    console.log("Updated connections:", updatedConnections);
    setNeurons(updatedNeurons);
    setConnections(updatedConnections);
  }, [controller]);

  useEffect(() => {
    (window as any).updateNeuralNetVisualization = updateVisualization;
    return () => {
      delete (window as any).updateNeuralNetVisualization;
    };
  }, [updateVisualization]);

  const updateNeuronPosition = useCallback((neuronId: string, newPosition: Vector3) => {
    controller.updateNeuronPosition(neuronId, newPosition);
    updateVisualization();
  }, [controller, updateVisualization]);

  return (
    <>
      {neurons.map((neuron) => (
        <Neuron
          key={neuron.id}
          neuron={neuron}
          onDrag={(newPosition) => updateNeuronPosition(neuron.id, newPosition)}
          isRealigning={false}
        />
      ))}
      {connections.map((connection) => (
        <Connection
          key={connection.id}
          connection={connection}
          neurons={neurons}
        />
      ))}
    </>
  );
};

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

// Wrapper component that sets up the Three.js scene
const NeuralNetVisualization = ({ children, controller }: { children: React.ReactNode; controller: NeuralNetController }) => {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <color attach="background" args={['#121212']} />
        {/* Remove or reduce the intensity of these lights */}
        {/* <ambientLight intensity={0.5} /> */}
        {/* <pointLight position={[10, 10, 10]} /> */}
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

export default NeuralNetVisualization