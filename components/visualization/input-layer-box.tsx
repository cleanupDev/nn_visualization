import React, { useMemo } from 'react'
import { Box, Line, Html, Text, RoundedBox } from '@react-three/drei'
import { Color, Vector3 } from 'three'
import { NeuronVisual, Connection as ConnectionType } from '../store'

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
    
    // Make the box narrower to match neuron proportions better
    // Using a smaller value (1.0 instead of previous width calculation)
    const sizeX = 1.0
    
    // Make sure height matches or slightly exceeds the hidden layer height
    const sizeY = Math.max(maxY - minY + 1, outputNeurons.length * 1.2)
    
    return { 
      boxCenter: new Vector3(centerX, centerY, 0), 
      boxSize: new Vector3(sizeX, sizeY, 0.5),
      inputDimensions: inputNeurons.length
    }
  }, [inputNeurons, outputNeurons])

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
        // Use same color logic as in Connection component
        if (sampleConnection.strength > 0.7) {
          color = new Color(0.0, 0.7, 0.2) // Strong positive
        } else if (sampleConnection.strength > 0.55) {
          color = new Color(0.3, 0.7, 0.3) // Weak positive
        } else if (sampleConnection.strength >= 0.45) {
          color = new Color(0.3, 0.35, 0.45) // Neutral
        } else if (sampleConnection.strength >= 0.3) {
          color = new Color(0.7, 0.3, 0.3) // Weak negative
        } else {
          color = new Color(0.7, 0.1, 0.1) // Strong negative
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
            color="#3a86ff" 
            transparent 
            opacity={0.7}
            roughness={0.3}
            metalness={0.2}
          />
        </RoundedBox>
        
        {/* Use Text component for sharper text rendering */}
        <Text
          position={[boxCenter.x - boxSize.x/2 - 1.2, boxCenter.y, boxCenter.z]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.5}
          lineHeight={1.5}
        >
          Input-Layer{'\n'}Input.Dim {inputDimensions}
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