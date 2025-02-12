import React, { useMemo, useRef, useState, useCallback } from 'react'
import { useThree, useFrame, ThreeEvent } from '@react-three/fiber'
import { Color, Vector3, Plane, Mesh } from 'three'
import { useSpring, animated } from '@react-spring/three'
import { NeuronVisual } from '../store'
import { OrbitControls, Html } from '@react-three/drei'
import { DraggableWindowComponent } from '../draggable-window'

export default function Neuron({ neuron, isRealigning }: { neuron: NeuronVisual; isRealigning: boolean }) {
  const meshRef = useRef<Mesh>(null)
  const { camera, raycaster, mouse } = useThree()
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])
  const [showWindow, setShowWindow] = useState(false)

  const { animatedPosition } = useSpring({
    animatedPosition: isRealigning ? [neuron.position.x, neuron.position.y, neuron.position.z] : [neuron.position.x, neuron.position.y, neuron.position.z],
    config: { mass: 1, tension: 180, friction: 12 }
  })

  const neuronColor = useMemo(() => new Color('#1971c2'), [])
  const hoverColor = useMemo(() => neuronColor.clone().lerp(new Color(1, 1, 1), 0.3), [neuronColor])

  const onPointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setIsDragging(true)
  }, [])

  const onPointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const onPointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      raycaster.setFromCamera(mouse, camera)
      const intersectionPoint = new Vector3()
      if (raycaster.ray.intersectPlane(dragPlane, intersectionPoint)) {
        console.log('Drag intersection point:', intersectionPoint)
      }
    }
  }, [isDragging, camera, mouse, dragPlane, raycaster])

  const onPointerEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const onPointerLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const onClick = useCallback(() => {
    console.log('Neuron clicked')
    setShowWindow(true)
  }, [])

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(neuron.position)
      meshRef.current.scale.setScalar(isHovered ? 1.2 : 1)
    }
  })

  // TODO: replace example content for the draggable window
  const latexContent = 'When $a \\ne 0$, there are two solutions to $ax^2 + bx + c = 0$ and they are $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}$$'

  const graphData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [65, 59, 80, 81, 56, 55, 40],
        borderColor: '#2f9e44',
        backgroundColor: 'rgba(47, 158, 68, 0.5)',
      },
      {
        label: 'Dataset 2',
        data: [28, 48, 40, 19, 86, 27, 90],
        borderColor: '#e03131',
        backgroundColor: 'rgba(224, 49, 49, 0.5)',
      },
    ],
  }

  return (
    <>
    <animated.mesh
      ref={meshRef}
      position={animatedPosition as any} // Type assertion to avoid type mismatch
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
    {showWindow && (
      <Html center>
        <DraggableWindowComponent
          onClose={() => setShowWindow(false)}
          latexContent={latexContent}
          graphData={graphData}
          >
          <h2 className="text-xl font-bold mb-2">Hello, Three.js!</h2>
          <p>This is a draggable window that appeared when you clicked the box.</p>
          <p>You can move this window around the screen.</p>
          --- Testing ---
          <p>Neuron ID: {neuron.id}</p>
          <p>Layer: {neuron.layer}</p>
          <p>Type: {neuron.type}</p>
          <p>Activation: {neuron.activation}</p>
          <p>Weight: {neuron.weight}</p>
          <p>Bias: {neuron.bias}</p>
          <p>Activation function: {neuron.activationFunction}</p>
          ---------------
        </DraggableWindowComponent>
      </Html>
    )}
    </>
)}