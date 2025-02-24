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

  // Map the connection strength to a color
  // 0.0-0.3: Strong negative (red)
  // 0.3-0.48: Weak negative (light red)
  // 0.48-0.52: Neutral (gray)
  // 0.52-0.7: Weak positive (light green)
  // 0.7-1.0: Strong positive (bright green)
  const color = useMemo(() => {
    if (connection.strength > 0.7) {
      // Strong positive - bright green
      return new Color(0, 0.9, 0);
    } else if (connection.strength > 0.52) {
      // Weak positive - light green
      return new Color(0.4, 0.8, 0.4);
    } else if (connection.strength >= 0.48) {
      // Neutral - gray
      return new Color(0.6, 0.6, 0.6);
    } else if (connection.strength >= 0.3) {
      // Weak negative - light red
      return new Color(0.8, 0.4, 0.4);
    } else {
      // Strong negative - bright red
      return new Color(0.9, 0, 0);
    }
  }, [connection.strength])

  // Scale line width based on connection strength
  // Further from 0.5 (neutral) = thicker line
  const lineWidth = useMemo(() => {
    const strengthDiff = Math.abs(connection.strength - 0.5) * 2; // Map to 0-1
    return 1 + strengthDiff * 5; // Thicker base width (1) + up to 5x for strong connections
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