import React, { useMemo, useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Color, Vector3, BufferGeometry, MeshBasicMaterial, Matrix4, InstancedMesh as ThreeInstancedMesh } from 'three'
import { Instances, Instance } from '@react-three/drei'
import { Connection as ConnectionType, NeuronVisual } from '../store'

// Function to generate a hash for a connection's visual state
// This helps us detect when we need to re-render
const generateConnectionHash = (connections: ConnectionType[], neurons: NeuronVisual[]): string => {
  // Only use a few sample connections to keep this efficient
  const sampleSize = Math.min(10, connections.length);
  const sampleConnections = connections.slice(0, sampleSize);
  
  // Create a string representation of the state
  return sampleConnections.map(conn => {
    const startNeuron = neurons.find(n => n.id === conn.startNeuronId);
    const endNeuron = neurons.find(n => n.id === conn.endNeuronId);
    if (!startNeuron || !endNeuron) return '';
    
    return `${conn.id}:${conn.strength.toFixed(4)}:${startNeuron.position.x.toFixed(2)},${startNeuron.position.y.toFixed(2)}:${endNeuron.position.x.toFixed(2)},${endNeuron.position.y.toFixed(2)}`;
  }).join('|');
};

const BatchedConnections = React.memo(({ 
  connections, 
  neurons 
}: { 
  connections: ConnectionType[]; 
  neurons: NeuronVisual[] 
}) => {
  const { gl } = useThree()
  // Create a ref to track the previous state
  const prevStateRef = useRef('');
  const instanceMeshRefs = useRef<ThreeInstancedMesh[]>([]);
  
  // When component renders, calculate needed geometry data and instance matrices
  const { 
    geometries, 
    materials, 
    counts,
    connectionGroups
  } = useMemo(() => {
    // Generate a hash of the current state
    const currentStateHash = generateConnectionHash(connections, neurons);
    
    // If state hasn't changed, use the cached value from last render
    if (currentStateHash === prevStateRef.current && prevStateRef.current !== '') {
      console.log('Skipping BatchedConnections calculation - no changes detected');
      return { geometries: [], materials: [], counts: [], connectionGroups: [] };
    }
    
    // Update the state hash
    prevStateRef.current = currentStateHash;
    
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
            
            // Store the matrix for this connection
            group.matrices.push(matrix)
          }
        })
        
        if (group.matrices.length > 0) {
          // Create cylinder geometry (adjust dimensions for appropriate appearance)
          const cylinderRadius = 0.025 // Base radius for connections
          const cylinderGeometry = new BufferGeometry().setFromPoints([
            new Vector3(0, -0.5, 0),
            new Vector3(0, 0.5, 0)
          ])
          
          geometries.push(cylinderGeometry)
          materials.push(material)
          counts.push(group.matrices.length)
        }
      })
    
    console.log(`Prepared batched rendering for ${counts.reduce((a, b) => a + b, 0)} connections in ${counts.length} groups`)
    
    return { 
      geometries, 
      materials, 
      counts,
      connectionGroups: connectionGroups.filter(group => group.matrices.length > 0)
    }
  }, [connections, neurons])
  
  // Setup the instance meshes after render
  useEffect(() => {
    // Skip if we don't have any connections
    if (!connectionGroups.length) return;
    
    // Update the matrices on the instanced meshes
    connectionGroups.forEach((group, groupIndex) => {
      const mesh = instanceMeshRefs.current[groupIndex];
      if (!mesh) return;
      
      // Update each matrix
      group.matrices.forEach((matrix, matrixIndex) => {
        mesh.setMatrixAt(matrixIndex, matrix);
      });
      
      // Mark instance matrix as needing update
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [connectionGroups]);
  
  // Only render if we have something to render
  return (
    <>
      {connectionGroups.map((group, groupIndex) => (
        <group key={`connection-group-${groupIndex}`}>
          {group.matrices.length > 0 && (
            <instancedMesh 
              ref={(mesh) => {
                if (mesh) instanceMeshRefs.current[groupIndex] = mesh;
              }}
              args={[geometries[groupIndex], materials[groupIndex], group.matrices.length]}
            />
          )}
        </group>
      ))}
    </>
  )
}, (prevProps, nextProps) => {
  // Perform a basic check to see if we need to re-render
  if (prevProps.connections.length !== nextProps.connections.length) {
    return false; // Re-render needed
  }
  
  // Generate hashes for current and next state
  const prevHash = generateConnectionHash(prevProps.connections, prevProps.neurons);
  const nextHash = generateConnectionHash(nextProps.connections, nextProps.neurons);
  
  // If hashes match, no re-render needed
  return prevHash === nextHash;
});

BatchedConnections.displayName = 'BatchedConnections';

export default BatchedConnections; 