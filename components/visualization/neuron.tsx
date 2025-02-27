import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useThree, useFrame, ThreeEvent } from '@react-three/fiber'
import { Color, Vector3, Plane, Mesh } from 'three'
import { useSpring, animated } from '@react-spring/three'
import { NeuronVisual, useModelStore } from '../store'
import { OrbitControls, Html } from '@react-three/drei'
import { DraggableWindowComponent } from '../draggable-window'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

// Memoize the Neuron component to prevent unnecessary re-renders
export default React.memo(function Neuron({ neuron, isRealigning }: { neuron: NeuronVisual; isRealigning: boolean }) {
  const meshRef = useRef<Mesh>(null)
  const { camera, raycaster, mouse } = useThree()
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])
  const [showWindow, setShowWindow] = useState(false)
  
  // Access the global state for real-time updates - get only what we need
  const toggleNeuronWindow = useModelStore(state => state.toggleNeuronWindow)
  const is_training = useModelStore(state => state.is_training)
  const curr_epoch = useModelStore(state => state.curr_epoch)
  const animationSpeed = useModelStore(state => state.animationSpeed)
  
  // Update window state when it changes
  useEffect(() => {
    // When window is opened or closed, update the neuron's tracking state in the store
    toggleNeuronWindow(neuron.id, showWindow);
  }, [showWindow, neuron.id, toggleNeuronWindow]);

  // Optimize the animation with reduced recomputation
  const { animatedPosition } = useSpring({
    animatedPosition: isRealigning ? [neuron.position.x, neuron.position.y, neuron.position.z] : [neuron.position.x, neuron.position.y, neuron.position.z],
    config: { mass: 1, tension: 180, friction: 12 }
  })

  // Use the same color (input neuron dark blue) for all neurons
  const neuronColor = useMemo(() => {
    // Darker blue for all neurons
    return new Color(0.0, 0.3, 0.6);
  }, []);
  
  // Brighter hover color
  const hoverColor = useMemo(() => {
    // Slightly brighter blue for hover effect
    return new Color(0.1, 0.4, 0.8);
  }, []);
  
  // Emissive color for the glow effect - less bright than main color
  const emissiveColor = useMemo(() => neuronColor.clone().multiplyScalar(0.4), [neuronColor]);
  
  // Hover emissive - brighter glow on hover
  const hoverEmissive = useMemo(() => emissiveColor.clone().multiplyScalar(2), [emissiveColor]);

  // Optimize pointer event handlers
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
      // Only log if actually needed for debugging
      if (raycaster.ray.intersectPlane(dragPlane, intersectionPoint)) {
        // Commented out to reduce console spam
        // console.log('Drag intersection point:', intersectionPoint)
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
    // Reduce console logging
    // console.log('Neuron clicked:', neuron.id);
    setShowWindow(true);
  }, [])

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(neuron.position)
      meshRef.current.scale.setScalar(isHovered ? 1.2 : 1)
    }
  })

  // Get the graph data from the neuron's history in the store
  const graphData = useMemo(() => {
    // Don't calculate this at all if window isn't shown
    if (!showWindow) return undefined;
    
    // Use the neuron's history from the store if available, or create placeholder data
    const weightHistory = neuron.weightHistory || [neuron.weight];
    const biasHistory = neuron.biasHistory || [neuron.bias];
    const activationHistory = neuron.activationHistory || [neuron.activation];
    
    // Use the slider value directly with no calculations
    const epochInterval = animationSpeed;
    
    // Create epoch-based labels using the dynamic epochInterval
    const timeLabels = weightHistory.map((_, i) => {
      if (i === 0) return '0'; // First point is always epoch 0
      if (i === weightHistory.length - 1) return curr_epoch.toString(); // Last point is current epoch
      // Adjust label calculation based on animation speed
      return Math.floor((i * epochInterval)).toString();
    });
    
    return {
      labels: timeLabels,
      datasets: [
        {
          label: 'Weight',
          data: weightHistory,
          borderColor: '#00cc33', // Vibrant deep green - matches positive connections
          backgroundColor: 'rgba(0, 204, 51, 0.15)',
          tension: 0.2,
        },
        {
          label: 'Bias',
          data: biasHistory,
          borderColor: '#ff0000', // Vibrant deep red - matches negative connections
          backgroundColor: 'rgba(255, 0, 0, 0.15)',
          tension: 0.2,
        },
        {
          label: 'Activation',
          data: activationHistory,
          borderColor: '#1971c2', // Vibrant deep blue - matches neuron color
          backgroundColor: 'rgba(25, 113, 194, 0.15)',
          tension: 0.2,
        }
      ]
    };
  }, [neuron.weightHistory, neuron.biasHistory, neuron.activationHistory, 
      neuron.weight, neuron.bias, neuron.activation, curr_epoch, showWindow, animationSpeed]);

  // Prepare connected neurons information
  const connectedNeurons = useMemo(() => {
    // Skip calculation if window isn't shown
    if (!showWindow) return [];
    
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
        rawWeight: conn.rawWeight,
        direction: isOutput ? 'output' : 'input'
      };
    });
  }, [neuron.id, showWindow, useModelStore]);

  // Get input connections for formula (only when needed)
  const inputConnections = useMemo(() => {
    return showWindow ? connectedNeurons.filter(conn => conn.direction === 'input') : [];
  }, [connectedNeurons, showWindow]);

  // Format neuron title for the window
  const getNeuronTitle = () => {
    const typeDisplay = neuron.type.charAt(0).toUpperCase() + neuron.type.slice(1);
    return `${typeDisplay} Neuron - Layer ${neuron.layer}`;
  };

  // Generate LaTeX formula for the neuron
  const getNeuronFormula = useCallback(() => {
    // Don't generate formula if window isn't shown
    if (!showWindow) return '';
    
    // If not a hidden/output neuron, return empty string
    if (neuron.type === 'input') {
      return '';
    }
    
    // Create the formula based on activation function
    let activationFuncDisplay = '';
    switch (neuron.activationFunction) {
      case 'sigmoid': activationFuncDisplay = '\\sigma'; break;
      case 'relu': activationFuncDisplay = '\\text{ReLU}'; break;
      case 'tanh': activationFuncDisplay = '\\tanh'; break;
      case 'softmax': activationFuncDisplay = '\\text{softmax}'; break;
      default: activationFuncDisplay = neuron.activationFunction;
    }
    
    // Simplify formula to reduce rendering complexity
    // Just show the general form rather than all individual weights
    return `
Neuron Formula:

$a = ${activationFuncDisplay}(z)$

$z = w_1x_1 + w_2x_2 + ... + w_nx_n + b$

Where:
$b = ${neuron.bias.toFixed(4)}$ (bias)
    `;
  }, [neuron.activationFunction, neuron.bias, neuron.type, showWindow]);

  // Memoize the actual LaTeX content to prevent recalculation
  const latexContent = useMemo(() => {
    return showWindow ? getNeuronFormula() : '';
  }, [showWindow, getNeuronFormula]);

  // Configure the Chart.js options - optimize for performance
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      // Just use the slider value directly 
      duration: animationSpeed,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 8,
          padding: 8,
          font: { size: 9 },
        },
      },
      tooltip: {
        enabled: true, // Can be disabled for even better performance
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            if (index === 0) return 'Initial';
            if (index === context[0].dataset.data.length - 1) 
              return `Current (Epoch ${curr_epoch})`;
            return `Epoch ${context[0].label}`;
          },
        }
      },
    },
    elements: {
      point: {
        radius: 1, // Smaller points
        hoverRadius: 3, // Smaller hover radius
      },
      line: {
        borderWidth: 1, // Thinner lines
      }
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 5, // Even fewer ticks
          font: { size: 8 },
        },
        grid: {
          display: false, // Hide grid lines
        }
      },
      y: {
        ticks: {
          font: { size: 8 },
        },
        grid: {
          display: false, // Hide grid lines
        }
      },
    },
  }), [curr_epoch, animationSpeed]);

  const getValueColorClass = (value: number) => {
    if (value > 0) return 'text-green-500'; // Brighter green for positive
    if (value < 0) return 'text-red-500'; // Brighter red for negative
    return 'text-gray-400';
  };

  // Optimize connected neurons display to only show a limited number
  const displayedConnections = useMemo(() => {
    // Limit to at most 10 connections to prevent rendering lag
    const MAX_CONNECTIONS = 10;
    
    // Sort connections by weight magnitude (strongest first)
    const sortedConnections = [...connectedNeurons].sort((a, b) => 
      Math.abs(b.rawWeight) - Math.abs(a.rawWeight)
    );
    
    // Return at most MAX_CONNECTIONS connections
    return sortedConnections.slice(0, MAX_CONNECTIONS);
  }, [connectedNeurons]);
  
  // Memoize connection table rows to prevent unnecessary re-renders
  const connectionTableRows = useMemo(() => {
    if (!showWindow) return null;
    
    return displayedConnections.map((conn, i) => (
      <tr key={i} className="border-b border-gray-800">
        <td className="px-2 py-1">{conn.id.split('-').slice(-2).join('-')}</td>
        <td className="px-2 py-1 capitalize">{conn.type}</td>
        <td className="px-2 py-1 capitalize">{conn.direction}</td>
        <td className="px-2 py-1">
          <span 
            className={`px-1 rounded ${
              conn.strength > 0.7 ? 'bg-green-600' :
              conn.strength > 0.55 ? 'bg-green-500' :
              conn.strength < 0.3 ? 'bg-red-600' :
              conn.strength < 0.45 ? 'bg-red-500' :
              'bg-blue-100 text-gray-800'
            }`}
          >
            {conn.rawWeight.toFixed(3)}
          </span>
        </td>
      </tr>
    ));
  }, [displayedConnections, showWindow]);

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
      <sphereGeometry args={[0.25, 32, 32]} />
      <meshStandardMaterial 
        color={isHovered ? hoverColor : neuronColor} 
        emissive={isHovered ? hoverEmissive : emissiveColor}
        emissiveIntensity={isHovered ? 0.6 : 0.3}
        metalness={0.3}
        roughness={0.7}
        envMapIntensity={0.8}
      />
    </animated.mesh>
    {showWindow && (
      <Html center>
        <DraggableWindowComponent
          onClose={() => setShowWindow(false)}
          title={getNeuronTitle()}
          graphData={graphData}
          graphTitle="Neuron Properties Over Time"
          customGraphOptions={options}
          latexContent={latexContent}
          initialPosition={{ x: 100, y: 0 }}
        >
          <div className="neuron-info">
            <h2 className="text-xl font-bold mb-4 text-blue-500">Neuron Information</h2>
            
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
            
            <h3 className="text-lg font-bold mb-2 text-blue-500">Connected Neurons</h3>
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
                  {connectionTableRows}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-center mt-2">
              <div>
                <div className="font-semibold">Weight</div>
                <div className={getValueColorClass(neuron.weight)}>{neuron.weight.toFixed(4)}</div>
              </div>
              <div>
                <div className="font-semibold">Bias</div>
                <div className={getValueColorClass(neuron.bias)}>{neuron.bias.toFixed(4)}</div>
              </div>
              {!is_training && (
                <div>
                  <div className="font-semibold">Activation</div>
                  <div className={getValueColorClass(neuron.activation)}>{neuron.activation.toFixed(4)}</div>
                </div>
              )}
            </div>
          </div>
        </DraggableWindowComponent>
      </Html>
    )}
    </>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo to minimize re-renders
  // Only re-render in these specific cases:
  
  // Always re-render if realignment state changes
  if (prevProps.isRealigning !== nextProps.isRealigning) {
    return false;
  }
  
  // Different neuron IDs require re-render
  if (prevProps.neuron.id !== nextProps.neuron.id) {
    return false;
  }
  
  // Check position changes (needed for proper positioning)
  if (prevProps.neuron.position.x !== nextProps.neuron.position.x ||
      prevProps.neuron.position.y !== nextProps.neuron.position.y ||
      prevProps.neuron.position.z !== nextProps.neuron.position.z) {
    return false;
  }
  
  // Only check weight, bias or activation when a window is open
  // This prevents unnecessary re-renders when the window is closed
  // and these values are updated during training
  const hasOpenWindow = nextProps.neuron.isWindowOpen;
  
  if (hasOpenWindow) {
    // Check for changes in values that affect visualization
    if (prevProps.neuron.weight !== nextProps.neuron.weight ||
        prevProps.neuron.bias !== nextProps.neuron.bias ||
        prevProps.neuron.activation !== nextProps.neuron.activation) {
      return false;
    }
  }
  
  // If none of the above conditions triggered a re-render, skip rendering
  return true;
});