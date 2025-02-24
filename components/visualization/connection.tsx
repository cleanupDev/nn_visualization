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

  // Map the connection strength to a color with enhanced contrast and saturation
  // 0.0-0.3: Strong negative (bright red)
  // 0.3-0.48: Weak negative (vibrant pink/red)
  // 0.48-0.52: Neutral (bright silver)
  // 0.52-0.7: Weak positive (bright teal)
  // 0.7-1.0: Strong positive (vivid green)
  const color = useMemo(() => {
    if (connection.strength > 0.7) {
      // Strong positive - vivid green
      return new Color(0, 1, 0.2); // More saturated green
    } else if (connection.strength > 0.52) {
      // Weak positive - bright teal
      return new Color(0, 0.9, 0.6); // More distinctive from strong positive
    } else if (connection.strength >= 0.48) {
      // Neutral - bright silver
      return new Color(0.8, 0.8, 0.9); // Brighter, slightly blue-tinted
    } else if (connection.strength >= 0.3) {
      // Weak negative - vibrant pink/red
      return new Color(1, 0.4, 0.6); // More vivid and distinctive
    } else {
      // Strong negative - bright red
      return new Color(1, 0.1, 0.1); // More saturated red
    }
  }, [connection.strength])

  // Scale line width based on connection strength with increased base thickness
  // Further from 0.5 (neutral) = thicker line
  const lineWidth = useMemo(() => {
    const strengthDiff = Math.abs(connection.strength - 0.5) * 2; // Map to 0-1
    return 1.5 + strengthDiff * 6; // Thicker base width (1.5) + up to 6x for strong connections
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