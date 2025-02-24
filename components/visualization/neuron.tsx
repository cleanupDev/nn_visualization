import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useThree, useFrame, ThreeEvent } from '@react-three/fiber'
import { Color, Vector3, Plane, Mesh } from 'three'
import { useSpring, animated } from '@react-spring/three'
import { NeuronVisual, useModelStore } from '../store'
import { OrbitControls, Html } from '@react-three/drei'
import { DraggableWindowComponent } from '../draggable-window'

export default function Neuron({ neuron, isRealigning }: { neuron: NeuronVisual; isRealigning: boolean }) {
  const meshRef = useRef<Mesh>(null)
  const { camera, raycaster, mouse } = useThree()
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])
  const [showWindow, setShowWindow] = useState(false)
  
  // Track neuron data over time for graphing
  const [weightHistory, setWeightHistory] = useState<number[]>([neuron.weight])
  const [biasHistory, setBiasHistory] = useState<number[]>([neuron.bias])
  const [activationHistory, setActivationHistory] = useState<number[]>([neuron.activation])
  const [timeLabels, setTimeLabels] = useState<string[]>(['0'])
  
  // Track previous epoch to detect resets
  const [prevEpoch, setPrevEpoch] = useState(0)
  
  // Access the global state for real-time updates
  const { curr_epoch, is_training, neurons } = useModelStore();
  
  // Reset histories when training starts a new session
  // We now need to detect when it's a new training session vs. continuing training
  useEffect(() => {
    // Only reset when:
    // 1. Not currently training AND epoch count drops to zero (new training session started)
    // 2. Was training, and epoch dropped dramatically (new training session started)
    const isNewTrainingSession = 
      (!is_training && curr_epoch === 0 && prevEpoch > 0) || 
      (curr_epoch < prevEpoch && !is_training);
    
    if (isNewTrainingSession) {
      // Reset all histories for a new training session
      setWeightHistory([neuron.weight]);
      setBiasHistory([neuron.bias]);
      setActivationHistory([neuron.activation]);
      setTimeLabels(['0']);
      console.log('Reset neuron histories for new training session');
    }
    
    // Update previous epoch
    setPrevEpoch(curr_epoch);
  }, [curr_epoch, is_training, neuron.weight, neuron.bias, neuron.activation, prevEpoch]);
  
  // Update histories when the neuron properties change
  useEffect(() => {
    if (is_training) {
      // Track weight changes
      setWeightHistory(prev => {
        const newHistory = [...prev, neuron.weight];
        // Keep only the last 20 values for better visualization
        return newHistory.slice(-20);
      });
      
      // Track bias changes
      setBiasHistory(prev => {
        const newHistory = [...prev, neuron.bias];
        return newHistory.slice(-20);
      });
      
      // Track activation changes
      setActivationHistory(prev => {
        const newHistory = [...prev, neuron.activation];
        return newHistory.slice(-20);
      });
      
      // Update time labels
      setTimeLabels(prev => {
        const newLabels = [...prev, curr_epoch.toString()];
        return newLabels.slice(-20);
      });
    }
  }, [neuron.weight, neuron.bias, neuron.activation, curr_epoch, is_training]);

  const { animatedPosition } = useSpring({
    animatedPosition: isRealigning ? [neuron.position.x, neuron.position.y, neuron.position.z] : [neuron.position.x, neuron.position.y, neuron.position.z],
    config: { mass: 1, tension: 180, friction: 12 }
  })

  // Get color based on neuron type
  const neuronColor = useMemo(() => {
    switch(neuron.type) {
      case 'input': return new Color('#1971c2'); // Blue
      case 'hidden': return new Color('#2f9e44'); // Green
      case 'output': return new Color('#e03131'); // Red
      default: return new Color('#1971c2');
    }
  }, [neuron.type]);
  
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
    console.log('Neuron clicked:', neuron.id);
    setShowWindow(true)
  }, [neuron.id])

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(neuron.position)
      meshRef.current.scale.setScalar(isHovered ? 1.2 : 1)
    }
  })

  // Get the graph data from the history
  const graphData = useMemo(() => ({
    labels: timeLabels,
    datasets: [
      {
        label: 'Weight',
        data: weightHistory,
        borderColor: '#2f9e44', // Green
        backgroundColor: 'rgba(47, 158, 68, 0.1)',
        tension: 0.2,
      },
      {
        label: 'Bias',
        data: biasHistory,
        borderColor: '#1971c2', // Blue
        backgroundColor: 'rgba(25, 113, 194, 0.1)',
        tension: 0.2,
      },
      {
        label: 'Activation',
        data: activationHistory,
        borderColor: '#e03131', // Red
        backgroundColor: 'rgba(224, 49, 49, 0.1)',
        tension: 0.2,
      },
    ],
  }), [timeLabels, weightHistory, biasHistory, activationHistory]);

  // Prepare connected neurons information
  const getConnectedNeurons = () => {
    const modelStore = useModelStore.getState();
    const connections = modelStore.connections.filter(
      c => c.startNeuronId === neuron.id || c.endNeuronId === neuron.id
    );
    
    return connections.map(conn => {
      const isOutput = conn.startNeuronId === neuron.id;
      const otherNeuronId = isOutput ? conn.endNeuronId : conn.startNeuronId;
      const otherNeuron = modelStore.visualNeurons.find(n => n.id === otherNeuronId);
      
      return {
        id: otherNeuronId,
        type: otherNeuron?.type || 'unknown',
        layer: otherNeuron?.layer || 0,
        strength: conn.strength,
        direction: isOutput ? 'output' : 'input'
      };
    });
  };

  // Format neuron title for the window
  const getNeuronTitle = () => {
    const typeDisplay = neuron.type.charAt(0).toUpperCase() + neuron.type.slice(1);
    return `${typeDisplay} Neuron - Layer ${neuron.layer}`;
  };

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
          title={getNeuronTitle()}
          graphData={graphData}
          graphTitle="Neuron Properties Over Time"
          initialPosition={{ x: 100, y: 0 }}
        >
          <div className="neuron-info">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Neuron Information</h2>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="font-semibold">ID:</div>
              <div>{neuron.id}</div>
              
              <div className="font-semibold">Layer:</div>
              <div>{neuron.layer}</div>
              
              <div className="font-semibold">Type:</div>
              <div className="capitalize">{neuron.type}</div>
              
              <div className="font-semibold">Activation:</div>
              <div>{neuron.activation.toFixed(4)}</div>
              
              <div className="font-semibold">Weight:</div>
              <div>{neuron.weight.toFixed(4)}</div>
              
              <div className="font-semibold">Bias:</div>
              <div>{neuron.bias.toFixed(4)}</div>
              
              <div className="font-semibold">Activation Function:</div>
              <div>{neuron.activationFunction}</div>
            </div>
            
            <h3 className="text-lg font-bold mb-2 text-blue-400">Connected Neurons</h3>
            <div className="max-h-40 overflow-y-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-2 py-1">ID</th>
                    <th className="text-left px-2 py-1">Type</th>
                    <th className="text-left px-2 py-1">Direction</th>
                    <th className="text-left px-2 py-1">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {getConnectedNeurons().map((conn, i) => (
                    <tr key={i} className="border-b border-gray-800">
                      <td className="px-2 py-1">{conn.id.split('-').slice(-2).join('-')}</td>
                      <td className="px-2 py-1 capitalize">{conn.type}</td>
                      <td className="px-2 py-1 capitalize">{conn.direction}</td>
                      <td className="px-2 py-1">
                        <span 
                          className={`px-1 rounded ${
                            conn.strength > 0.7 ? 'bg-green-900' :
                            conn.strength > 0.5 ? 'bg-green-800' :
                            conn.strength < 0.3 ? 'bg-red-900' :
                            conn.strength < 0.5 ? 'bg-red-800' :
                            'bg-gray-700'
                          }`}
                        >
                          {conn.strength.toFixed(3)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DraggableWindowComponent>
      </Html>
    )}
    </>
)}