import React, { useMemo, useRef, useState, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Color, Vector3, Plane } from 'three'
import { useSpring, animated } from '@react-spring/three'
import { Neuron as NeuronType } from './neuralNetController'

export default function Neuron({ neuron, onDrag, isRealigning }: { neuron: NeuronType; onDrag: (position: Vector3) => void; isRealigning: boolean }) {
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