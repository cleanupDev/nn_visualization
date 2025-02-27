import React, { useMemo, useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Color, Vector3, InstancedMesh, Matrix4, MeshBasicMaterial, BufferGeometry, CylinderGeometry } from 'three'
import { Connection as ConnectionType, NeuronVisual } from '../store'

// Cache for geometries to avoid recreating them
const geometryCache = new Map<string, CylinderGeometry>();

// Component for efficiently rendering many connections at once
const BatchedConnections = React.memo(({ 
  connections, 
  neurons 
}: { 
  connections: ConnectionType[]; 
  neurons: NeuronVisual[] 
}) => {
  const { gl } = useThree()
  const instancedMeshRefs = useRef<(InstancedMesh | null)[]>([]);
  
  // Create optimized instanced meshes for connections grouped by similar appearance
  const { 
    geometries, 
    materials,
    counts,
    connectionGroups
  } = useMemo(() => {
    // Skip processing if we don't have connections or neurons
    if (connections.length === 0 || neurons.length === 0) {
      return { geometries: [], materials: [], counts: [], connectionGroups: [] }
    }
    
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
      connections: [] as ConnectionType[],
      matrices: [] as Matrix4[]
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
    
    // Prepare arrays to hold our geometries, materials, and counts for each group
    const geometries: BufferGeometry[] = []
    const materials: MeshBasicMaterial[] = []
    const counts: number[] = []
    
    // Process only groups that have connections
    connectionGroups
      .filter(group => group.connections.length > 0)
      .forEach((group) => {
        // Create a material for this group
        const material = new MeshBasicMaterial({ 
          color: group.range.color,
          transparent: true,
          opacity: 0.8
        })
        
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
            group.matrices.push(matrix)
          }
        })
        
        // Only create a geometry and material if we have valid connections
        if (group.matrices.length > 0) {
          // Use cached cylinder geometry or create a new one
          const cylinderKey = '1,1,6,1';
          let geometry: CylinderGeometry;
          
          if (geometryCache.has(cylinderKey)) {
            geometry = geometryCache.get(cylinderKey)!;
          } else {
            geometry = new CylinderGeometry(1, 1, 1, 6, 1, false);
            geometryCache.set(cylinderKey, geometry);
          }
          
          // Store the geometry, material and count
          geometries.push(geometry)
          materials.push(material)
          counts.push(group.matrices.length)
        }
      })
    
    return { geometries, materials, counts, connectionGroups }
  }, [connections, neurons])
  
  // Update matrices for the instanced meshes
  useEffect(() => {
    // Only run if we have instanced mesh refs
    if (instancedMeshRefs.current.length === 0) return;
    
    connectionGroups.forEach((group, groupIndex) => {
      const mesh = instancedMeshRefs.current[groupIndex];
      if (!mesh) return;
      
      // Update each matrix in the instanced mesh
      group.matrices.forEach((matrix, matrixIndex) => {
        mesh.setMatrixAt(matrixIndex, matrix);
      });
      
      // Mark the instance matrix as needs update
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [connectionGroups]);
  
  // Skip rendering if no connections
  if (geometries.length === 0) return null;
  
  // Render the instanced meshes
  return (
    <>
      {geometries.map((geometry, index) => (
        <instancedMesh
          key={`connection-batch-${index}`}
          ref={el => instancedMeshRefs.current[index] = el}
          args={[geometry, materials[index], counts[index]]}
          frustumCulled={true}
        />
      ))}
    </>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for memo to prevent unnecessary rerenders
  if (prevProps.connections.length !== nextProps.connections.length) return false;
  if (prevProps.neurons.length !== nextProps.neurons.length) return false;
  
  // Only do a deep check if really necessary - this is performance critical
  // For this case, mostly check if connection counts match which is good enough
  // for most use cases rather than comparing every connection
  return true;
})

export default BatchedConnections; 