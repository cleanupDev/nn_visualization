import React, { useMemo } from 'react'
import { Box, Line, Html, Text, RoundedBox } from '@react-three/drei'
import { Color, Vector3 } from 'three'
import { NeuronVisual, Connection as ConnectionType } from '../store'
import { useModelStore } from '../store'

interface InputLayerBoxProps {
  inputNeurons: NeuronVisual[]
  connections: ConnectionType[]
  outputNeurons: NeuronVisual[]
}

export default function InputLayerBox({ 
  inputNeurons, 
  connections, 
  outputNeurons 
}: InputLayerBoxProps) {
  // Get the dataset to apply specific optimizations for MNIST
  const selectedDataset = useModelStore(state => state.selectedDataset)
  const isMNIST = selectedDataset === 'mnist'
  
  // Calculate the dimensions of the box based on both input neurons and hidden layer
  const { boxCenter, boxSize, inputDimensions } = useMemo(() => {
    if (inputNeurons.length === 0 || outputNeurons.length === 0) {
      return { 
        boxCenter: new Vector3(0, 0, 0), 
        boxSize: new Vector3(1, 1, 1),
        inputDimensions: 0
      }
    }

    // Find the min and max positions of all input neurons (for X position)
    const inputPositions = inputNeurons.map(n => n.position)
    const minX = Math.min(...inputPositions.map(p => p.x)) - 0.5
    const maxX = Math.max(...inputPositions.map(p => p.x)) + 0.5
    
    // For Y position and height, use the hidden layer neurons to determine the appropriate size
    const hiddenPositions = outputNeurons.map(n => n.position)
    const minY = Math.min(...hiddenPositions.map(p => p.y)) - 0.5
    const maxY = Math.max(...hiddenPositions.map(p => p.y)) + 0.5
    
    // Calculate the center and size
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    
    // For MNIST, use a specific size that looks better with the 784 neurons
    // Make the box narrower to match neuron proportions better
    const sizeX = isMNIST ? 1.2 : 1.0
    
    // Make sure height matches or slightly exceeds the hidden layer height
    const sizeY = Math.max(maxY - minY + 1, outputNeurons.length * (isMNIST ? 1.4 : 1.2))
    
    return { 
      boxCenter: new Vector3(centerX, centerY, 0), 
      boxSize: new Vector3(sizeX, sizeY, isMNIST ? 0.6 : 0.5),
      inputDimensions: inputNeurons.length
    }
  }, [inputNeurons, outputNeurons, isMNIST])

  // Generate connection lines from the box to the first hidden layer
  const connectionLines = useMemo(() => {
    // X position for the right edge of the box
    const rightEdgeX = boxCenter.x + boxSize.x / 2
    
    return outputNeurons.map((outputNeuron, index) => {
      // Create a straight connection from the box to each hidden layer neuron
      // The x-coordinate is at the right edge of the box
      // The y-coordinate matches the target neuron's y position for straight connections
      const startPoint = new Vector3(rightEdgeX, outputNeuron.position.y, 0)
      
      // Get a sample connection to determine the color and width
      const sampleConnection = connections.find(c => {
        const endNeuronId = c.endNeuronId
        return endNeuronId === outputNeuron.id
      })
      
      // Default connection properties if no sample connection is found
      let color = new Color(0.3, 0.35, 0.45) // Default color (neutral)
      let lineWidth = 2 // Default width
      
      // If we have a sample connection, use its properties
      if (sampleConnection) {
        // Use improved color logic as in updated Connection component
        if (sampleConnection.strength > 0.85) {
          // Very strong positive - bright green
          color = new Color(0.0, 0.8, 0.3);
        } else if (sampleConnection.strength > 0.7) {
          // Strong positive
          color = new Color(0.0, 0.7, 0.2);
        } else if (sampleConnection.strength > 0.55) {
          // Weak positive
          color = new Color(0.3, 0.7, 0.3);
        } else if (sampleConnection.strength >= 0.45) {
          // Neutral
          color = new Color(0.3, 0.35, 0.45);
        } else if (sampleConnection.strength >= 0.3) {
          // Weak negative
          color = new Color(0.7, 0.3, 0.3);
        } else if (sampleConnection.strength >= 0.15) {
          // Strong negative
          color = new Color(0.7, 0.1, 0.1);
        } else {
          // Very strong negative
          color = new Color(0.8, 0.0, 0.0);
        }
        
        // Use same width logic as in Connection component
        const strengthDiff = Math.abs(sampleConnection.strength - 0.5) * 2
        lineWidth = 2.0 + strengthDiff * 7
      }
      
      return {
        points: [startPoint, outputNeuron.position],
        color,
        lineWidth,
        key: `box-to-${outputNeuron.id}`
      }
    })
  }, [boxCenter, boxSize, outputNeurons, connections])

  // Create a dataset-specific label
  const datasetLabel = useMemo(() => {
    if (isMNIST) {
      return `MNIST Input\nInput.Dim ${inputDimensions}\n(28×28 image)`
    }
    return `Input-Layer\nInput.Dim ${inputDimensions}`
  }, [inputDimensions, isMNIST])

  // Adjust box color for MNIST
  const boxColor = isMNIST ? "#2a6dd9" : "#3a86ff"
  const boxOpacity = isMNIST ? 0.8 : 0.7

  // Use Text component from drei instead of Html for sharper text
  return (
    <>
      {/* Render the input layer as a rounded box */}
      <group>
        <RoundedBox
          position={boxCenter}
          args={[boxSize.x, boxSize.y, boxSize.z]}
          radius={0.1} // Corner radius
          smoothness={4} // Optional: Subdivisions of the roundness
        >
          <meshStandardMaterial 
            color={boxColor} 
            transparent 
            opacity={boxOpacity}
            roughness={0.3}
            metalness={0.2}
          />
        </RoundedBox>
        
        {/* Use Text component for sharper text rendering */}
        <Text
          position={[boxCenter.x - boxSize.x/2 - (isMNIST ? 1.5 : 1.2), boxCenter.y, boxCenter.z]}
          fontSize={isMNIST ? 0.18 : 0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.8}
          lineHeight={1.5}
        >
          {datasetLabel}
        </Text>
      </group>
      
      {/* Render connections from box to hidden layer */}
      {connectionLines.map(conn => (
        <Line
          key={conn.key}
          points={conn.points}
          color={conn.color}
          lineWidth={conn.lineWidth}
        />
      ))}
    </>
  )
} 