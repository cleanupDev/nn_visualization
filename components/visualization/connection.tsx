import React, { useMemo, useEffect, useState } from 'react'
import { Line } from '@react-three/drei'
import { Color } from 'three'
import { Connection as ConnectionType, NeuronVisual, useModelStore } from '../store'

export default function Connection({ connection, neurons }: { connection: ConnectionType; neurons: NeuronVisual[] }) {
  const startNeuron = neurons.find(n => n.id === connection.startNeuronId)
  const endNeuron = neurons.find(n => n.id === connection.endNeuronId)
  
  // Track connection strength changes over time
  const [strengthHistory, setStrengthHistory] = useState<number[]>([connection.strength])
  const { is_training, curr_epoch } = useModelStore()
  
  // Track previous epoch to detect new training sessions
  const [prevEpoch, setPrevEpoch] = useState(0)
  
  // Reset strength history on new training sessions
  useEffect(() => {
    // Detect new training session (epoch goes down or resets to 0)
    const isNewTrainingSession = 
      (!is_training && curr_epoch === 0 && prevEpoch > 0) || 
      (curr_epoch < prevEpoch && !is_training);
    
    if (isNewTrainingSession) {
      setStrengthHistory([connection.strength]);
    }
    
    // Update previous epoch
    setPrevEpoch(curr_epoch);
  }, [curr_epoch, is_training, connection.strength, prevEpoch]);
  
  // Update strength history when connection strength changes
  useEffect(() => {
    // Only record during training
    if (is_training) {
      setStrengthHistory(prev => {
        const newHistory = [...prev, connection.strength];
        // Keep last 10 values
        return newHistory.slice(-10);
      });
      
      // Debug output to console - only log some connections to avoid flooding
      if (connection.id.includes('input-0-0')) {
        console.log(`Connection strength updated: ${connection.id} -> ${connection.strength.toFixed(4)}`);
      }
    }
  }, [connection.strength, connection.id, is_training]);

  // Map the connection strength to a color using a vibrant red-green gradient
  // 0.0-0.3: Strong negative (vibrant deep red)
  // 0.3-0.45: Weak negative (vibrant light red)
  // 0.45-0.55: Neutral (light gray with slight blue tint)
  // 0.55-0.7: Weak positive (vibrant light green)
  // 0.7-1.0: Strong positive (vibrant deep green)
  const color = useMemo(() => {
    if (connection.strength > 0.7) {
      // Strong positive - vibrant deep green
      return new Color(0.0, 0.8, 0.2); // #00cc33 - vibrant deep green
    } else if (connection.strength > 0.55) {
      // Weak positive - vibrant light green
      return new Color(0.4, 0.9, 0.4); // #66e666 - vibrant light green
    } else if (connection.strength >= 0.45) {
      // Neutral - light blue-gray 
      return new Color(0.8, 0.85, 0.9); // #ccd9e6 - light blue-gray
    } else if (connection.strength >= 0.3) {
      // Weak negative - vibrant light red
      return new Color(1.0, 0.4, 0.4); // #ff6666 - vibrant light red
    } else {
      // Strong negative - vibrant deep red
      return new Color(1.0, 0.0, 0.0); // #ff0000 - vibrant deep red
    }
  }, [connection.strength])

  // Scale line width based on connection strength with more noticeable differences
  const lineWidth = useMemo(() => {
    const strengthDiff = Math.abs(connection.strength - 0.5) * 2; // Map to 0-1
    return 1.5 + strengthDiff * 5; // Thicker base width (1.5) + up to 5x for strong connections
  }, [connection.strength]);

  if (!startNeuron || !endNeuron) {
    return null
  }

  // Check for significant strength change to aid debugging
  const hasSignificantChange = strengthHistory.length > 1 && 
    Math.abs(strengthHistory[strengthHistory.length - 1] - strengthHistory[0]) > 0.1;

  return (
    <Line
      points={[startNeuron.position, endNeuron.position]}
      color={color}
      lineWidth={lineWidth}
      onClick={() => {
        console.log(`Connection: ${startNeuron.id} → ${endNeuron.id}`);
        console.log(`Strength: ${connection.strength.toFixed(4)}`);
        console.log(`History: ${strengthHistory.map(s => s.toFixed(2)).join(' → ')}`);
        console.log(`Has changed: ${hasSignificantChange ? 'YES' : 'no'}`);
      }}
    />
  )
}