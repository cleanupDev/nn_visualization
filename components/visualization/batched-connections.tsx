import React, { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { Color, Vector3, InstancedMesh, Matrix4, MeshBasicMaterial, BufferGeometry, CylinderGeometry } from 'three'
import { Connection as ConnectionType, NeuronVisual } from '../store'

// Component for efficiently rendering many connections at once
export default function BatchedConnections({ 
  connections, 
  neurons 
}: { 
  connections: ConnectionType[]; 
  neurons: NeuronVisual[] 
}) {
  const { gl } = useThree()
  
  // Create optimized instanced meshes for connections grouped by similar appearance
  const { 
    geometries, 
    materials,
    matrices, 
    counts
  } = useMemo(() => {
    // Skip processing if we don't have connections or neurons
    if (connections.length === 0 || neurons.length === 0) {
      return { geometries: [], materials: [], matrices: [], counts: [] }
    }

    console.log(`Batching ${connections.length} connections for efficient rendering`)
    
    // Group connections by strength range for batching
    const strengthRanges = [
      { min: 0.0, max: 0.3, color: new Color(0.7, 0.1, 0.1) },   // Strong negative
      { min: 0.3, max: 0.45, color: new Color(0.7, 0.3, 0.3) },  // Weak negative
      { min: 0.45, max: 0.55, color: new Color(0.3, 0.35, 0.45) }, // Neutral
      { min: 0.55, max: 0.7, color: new Color(0.3, 0.7, 0.3) },  // Weak positive
      { min: 0.7, max: 1.0, color: new Color(0.0, 0.7, 0.2) }    // Strong positive
    ]
    
    // Create a multi-group structure for batching similar connections
    const connectionGroups = strengthRanges.map(range => ({ 
      range, 
      connections: [] as ConnectionType[] 
    }))
    
    // Classify each connection into its appropriate group
    connections.forEach(connection => {
      const group = connectionGroups.find(
        g => connection.strength >= g.range.min && connection.strength <= g.range.max
      )
      if (group) {
        group.connections.push(connection)
      }
    })
    
    // Prepare arrays to hold our geometries, materials, matrices and counts for each group
    const geometries: BufferGeometry[] = []
    const materials: MeshBasicMaterial[] = []
    const matrices: Matrix4[][] = []
    const counts: number[] = []
    
    // Process only groups that have connections
    connectionGroups
      .filter(group => group.connections.length > 0)
      .forEach((group, groupIndex) => {
        // Create a material for this group
        const material = new MeshBasicMaterial({ 
          color: group.range.color,
          transparent: true,
          opacity: 0.8
        })
        
        // Store the group's matrices
        const groupMatrices: Matrix4[] = []
        
        // Process all connections in this group
        group.connections.forEach(connection => {
          // Find the neurons connected by this connection
          const startNeuron = neurons.find(n => n.id === connection.startNeuronId)
          const endNeuron = neurons.find(n => n.id === connection.endNeuronId)
          
          if (startNeuron && endNeuron) {
            // Create vectors from positions
            const start = new Vector3(
              startNeuron.position.x,
              startNeuron.position.y,
              startNeuron.position.z
            )
            
            const end = new Vector3(
              endNeuron.position.x,
              endNeuron.position.y,
              endNeuron.position.z
            )
            
            // Calculate connection length and midpoint
            const direction = end.clone().sub(start)
            const length = direction.length()
            
            // Skip invalid connections
            if (length < 0.01) return
            
            // Normalize the direction vector
            direction.normalize()
            
            // Calculate midpoint for position
            const midpoint = start.clone().add(end).multiplyScalar(0.5)
            
            // Adjust line width based on strength (similar to the Connection component)
            const strengthDiff = Math.abs(connection.strength - 0.5) * 2
            const lineWidth = 0.02 + strengthDiff * 0.07
            
            // Create transformation matrix
            const matrix = new Matrix4()
            
            // Set position to midpoint
            matrix.setPosition(midpoint)
            
            // Calculate quaternion for rotation to align with connection direction
            const quaternion = new Vector3(0, 1, 0).clone().applyAxisAngle(
              new Vector3(1, 0, 0), 
              Math.PI / 2
            )
            
            // Align the cylinder with the direction
            const up = new Vector3(0, 1, 0)
            
            // Calculate orthogonal vectors to form a basis
            const alignAxis = up.clone().cross(direction).normalize()
            const angle = Math.acos(up.dot(direction))
            
            if (alignAxis.length() > 0.001) {
              matrix.makeRotationAxis(alignAxis, angle)
            }
            
            // Scale the cylinder to match the connection length and width
            matrix.scale(new Vector3(lineWidth, length / 2, lineWidth))
            
            // Move cylinder to midpoint
            matrix.setPosition(midpoint)
            
            // Add the matrix to our group
            groupMatrices.push(matrix)
          }
        })
        
        // Only create a geometry and material if we have valid connections
        if (groupMatrices.length > 0) {
          // Create a cylinder for the connection lines
          const geometry = new CylinderGeometry(1, 1, 1, 6, 1, false)
          
          // Store the geometry, material, matrices and count
          geometries.push(geometry)
          materials.push(material)
          matrices.push(groupMatrices)
          counts.push(groupMatrices.length)
        }
      })
    
    return { geometries, materials, matrices, counts }
  }, [connections, neurons])
  
  // Render the instanced meshes
  return (
    <>
      {geometries.map((geometry, index) => (
        <instancedMesh
          key={`connection-batch-${index}`}
          args={[geometry, materials[index], counts[index]]}
        >
          {matrices[index].map((matrix, matrixIndex) => {
            // We need to set the matrix for each instance
            // This is done in a useEffect hook to ensure it's only done after the instancedMesh is created
            return (
              <primitive
                key={`matrix-${matrixIndex}`}
                object={matrix}
                attach={`instanceMatrix[${matrixIndex}]`}
              />
            )
          })}
        </instancedMesh>
      ))}
    </>
  )
} 