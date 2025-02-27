import React, { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { Color, Vector3 } from 'three'
import { Connection as ConnectionType, NeuronVisual } from '../store'

// Simple memoized component to render a connection between neurons
// Use memo to prevent unnecessary re-renders
const Connection = React.memo(({ 
  connection, 
  neurons 
}: { 
  connection: ConnectionType; 
  neurons: NeuronVisual[] 
}) => {
  // Find the connected neurons
  const { startNeuron, endNeuron, connectionProperties } = useMemo(() => {
    const startNeuron = neurons.find(n => n.id === connection.startNeuronId)
    const endNeuron = neurons.find(n => n.id === connection.endNeuronId)
    
    if (!startNeuron || !endNeuron) {
      return { 
        startNeuron: null, 
        endNeuron: null, 
        connectionProperties: null 
      }
    }
    
    // Create vectors for line endpoints
    const startPosition = new Vector3(
      startNeuron.position.x, 
      startNeuron.position.y, 
      startNeuron.position.z
    )
    
    const endPosition = new Vector3(
      endNeuron.position.x, 
      endNeuron.position.y, 
      endNeuron.position.z
    )
    
    // Skip if points are too close together
    if (startPosition.distanceTo(endPosition) < 0.01) {
      return {
        startNeuron: null,
        endNeuron: null,
        connectionProperties: null
      }
    }

    // Calculate line width based on connection strength
    // Normalize the weight for visualization (0.5 is neutral)
    const strengthDiff = Math.abs(connection.strength - 0.5) * 2
    const lineWidth = 2.0 + strengthDiff * 7 // Use appropriate scale for Line component
    
    // Determine color based on connection strength - improved visualization for MNIST
    let color: Color;
    
    if (connection.strength > 0.85) {
      // Very strong positive - bright green
      color = new Color(0.0, 0.8, 0.3);
    } else if (connection.strength > 0.7) {
      // Strong positive - deeper green
      color = new Color(0.0, 0.7, 0.2);
    } else if (connection.strength > 0.55) {
      // Weak positive - darker light green
      color = new Color(0.3, 0.7, 0.3);
    } else if (connection.strength >= 0.45) {
      // Neutral - darker blue-gray
      color = new Color(0.3, 0.35, 0.45);
    } else if (connection.strength >= 0.3) {
      // Weak negative - darker red
      color = new Color(0.7, 0.3, 0.3);
    } else if (connection.strength >= 0.15) {
      // Strong negative - deep dark red
      color = new Color(0.7, 0.1, 0.1);
    } else {
      // Very strong negative - bright red
      color = new Color(0.8, 0.0, 0.0);
    }
    
    return {
      startNeuron,
      endNeuron,
      connectionProperties: {
        points: [startPosition, endPosition],
        color,
        lineWidth,
        // Prevent transparency for better visibility
        transparent: false,
        dashed: false
      }
    }
  }, [connection, neurons])
  
  // Skip rendering if invalid
  if (!startNeuron || !endNeuron || !connectionProperties) return null
  
  return (
    <Line
      points={connectionProperties.points}
      color={connectionProperties.color}
      lineWidth={connectionProperties.lineWidth}
      dashed={connectionProperties.dashed}
      transparent={connectionProperties.transparent}
      onClick={() => {
        // Keep click handler minimal for performance
        console.log(`Connection: ${startNeuron.id} → ${endNeuron.id}, Strength: ${connection.strength.toFixed(4)}, Weight: ${connection.rawWeight?.toFixed(4) || 'N/A'}`);
      }}
    />
  )
}, (prevProps, nextProps) => {
  // Deep equality check for memoization
  // Only re-render if something important changed
  if (prevProps.connection.id !== nextProps.connection.id) return false;
  if (prevProps.connection.strength !== nextProps.connection.strength) return false;
  
  // Check if neuron positions have changed
  const prevStart = prevProps.neurons.find(n => n.id === prevProps.connection.startNeuronId);
  const prevEnd = prevProps.neurons.find(n => n.id === prevProps.connection.endNeuronId);
  const nextStart = nextProps.neurons.find(n => n.id === nextProps.connection.startNeuronId);
  const nextEnd = nextProps.neurons.find(n => n.id === nextProps.connection.endNeuronId);
  
  if (!prevStart || !prevEnd || !nextStart || !nextEnd) return false;
  
  // Check position equality
  if (
    prevStart.position.x !== nextStart.position.x ||
    prevStart.position.y !== nextStart.position.y ||
    prevStart.position.z !== nextStart.position.z ||
    prevEnd.position.x !== nextEnd.position.x ||
    prevEnd.position.y !== nextEnd.position.y ||
    prevEnd.position.z !== nextEnd.position.z
  ) {
    return false;
  }
  
  return true;
});

// For debugging
Connection.displayName = 'Connection';

export default Connection