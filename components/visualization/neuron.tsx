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

export default function Neuron({ neuron, isRealigning }: { neuron: NeuronVisual; isRealigning: boolean }) {
  const meshRef = useRef<Mesh>(null)
  const { camera, raycaster, mouse } = useThree()
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])
  const [showWindow, setShowWindow] = useState(false)
  
  // Access the global state for real-time updates
  const { curr_epoch, is_training, toggleNeuronWindow } = useModelStore();
  
  // Update window state when it changes
  useEffect(() => {
    // When window is opened or closed, update the neuron's tracking state in the store
    toggleNeuronWindow(neuron.id, showWindow);
  }, [showWindow, neuron.id, toggleNeuronWindow]);

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
    setShowWindow(true);
  }, [neuron.id])

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(neuron.position)
      meshRef.current.scale.setScalar(isHovered ? 1.2 : 1)
    }
  })

  // Get the graph data from the neuron's history in the store
  const graphData = useMemo(() => {
    // Use the neuron's history from the store if available, or create placeholder data
    const weightHistory = neuron.weightHistory || [neuron.weight];
    const biasHistory = neuron.biasHistory || [neuron.bias];
    const activationHistory = neuron.activationHistory || [neuron.activation];
    
    // Create epoch-based labels using epoch intervals (every 5 epochs)
    // This matches our recording interval in the store
    const epochInterval = 5;
    const timeLabels = weightHistory.map((_, i) => {
      if (i === 0) return '0'; // First point is always epoch 0
      if (i === weightHistory.length - 1) return curr_epoch.toString(); // Last point is current epoch
      // Other points follow the interval
      return (i * epochInterval).toString();
    });
    
    return {
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
    };
  }, [neuron.weightHistory, neuron.biasHistory, neuron.activationHistory, neuron.weight, neuron.bias, neuron.activation, curr_epoch]);

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
        rawWeight: conn.rawWeight,
        direction: isOutput ? 'output' : 'input'
      };
    });
  };

  // Format neuron title for the window
  const getNeuronTitle = () => {
    const typeDisplay = neuron.type.charAt(0).toUpperCase() + neuron.type.slice(1);
    return `${typeDisplay} Neuron - Layer ${neuron.layer}`;
  };

  // Generate LaTeX formula for the neuron
  const getNeuronFormula = () => {
    const connectedNeurons = getConnectedNeurons();
    const inputConnections = connectedNeurons.filter(conn => conn.direction === 'input');
    
    // If no input connections or not a hidden/output neuron, return empty string
    if (inputConnections.length === 0 || neuron.type === 'input') {
      return '';
    }
    
    // Create the formula based on activation function
    let activationFuncDisplay = '';
    let activationFuncLatex = '';
    switch (neuron.activationFunction) {
      case 'sigmoid':
        activationFuncDisplay = '\\sigma';
        activationFuncLatex = '\\sigma(z) = \\frac{1}{1 + e^{-z}}';
        break;
      case 'relu':
        activationFuncDisplay = '\\text{ReLU}';
        activationFuncLatex = '\\text{ReLU}(z) = \\max(0, z)';
        break;
      case 'tanh':
        activationFuncDisplay = '\\tanh';
        activationFuncLatex = '\\tanh(z) = \\frac{e^z - e^{-z}}{e^z + e^{-z}}';
        break;
      default:
        activationFuncDisplay = neuron.activationFunction;
        activationFuncLatex = '\\text{activation}(z)';
    }
    
    // Build the weighted sum formula
    const weightedSumTerms = inputConnections.map((conn, idx) => {
      const weight = conn.rawWeight.toFixed(4);
      const prefix = parseFloat(weight) >= 0 ? '+' : ''; // Add + for positive values except first term
      
      // Get a clean neuron ID for display
      const neuronShortId = conn.id.split('-').slice(-2).join('-');
      
      return `${idx === 0 ? weight : prefix + weight} \\cdot x_{${neuronShortId}}`;
    });
    
    // Add bias term
    const biasValue = neuron.bias.toFixed(4);
    const biasWithSign = neuron.bias >= 0 ? `+ ${biasValue}` : `${biasValue}`;
    
    // Final formula - use a simpler format with separate math blocks
    return `
Neuron Formula:

$a = ${activationFuncDisplay}(z)$

$z = ${weightedSumTerms.join(' ')} ${biasWithSign}$

Where:

$${activationFuncLatex}$

$a = \\text{neuron output}$
    `;
  };

  // Configure the Chart.js options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 100, // Faster animations for better performance
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 10,
          padding: 10,
          font: {
            size: 10,
          },
        },
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            // For first point, show "Initial"
            if (index === 0) return 'Initial';
            // For last point in training, show "Current (Epoch X)"
            if (index === context[0].dataset.data.length - 1) 
              return `Current (Epoch ${curr_epoch})`;
            // Otherwise show the epoch number
            return `Epoch ${context[0].label}`;
          },
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(4);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Epoch',
          font: {
            size: 10,
          },
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 8, // Limit the number of ticks shown
          font: {
            size: 8, // Smaller font for x-axis ticks
          },
        },
      },
      y: {
        title: {
          display: true,
          text: 'Value',
          font: {
            size: 10,
          },
        },
        ticks: {
          font: {
            size: 8, // Smaller font for y-axis ticks
          },
        },
      },
    },
  };

  const getValueColorClass = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-500';
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
          customGraphOptions={options}
          latexContent={getNeuronFormula()}
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
                          {conn.rawWeight.toFixed(4)}
                        </span>
                      </td>
                    </tr>
                  ))}
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
)}