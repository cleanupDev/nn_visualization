import React, { useEffect, useMemo } from 'react'
import { useModelStore } from '../store'
import Neuron from './neuron'
import Connection from './connection'
import InputLayerBox from './input-layer-box'
import BatchedConnections from './batched-connections'

export default function NeuralNetwork() {
  const { 
    visualNeurons, 
    connections, 
    layers, 
    initializeNetwork,
    model,
    curr_epoch,
    is_training,
    input_neurons,
    selectedDataset
  } = useModelStore()

  // Initialize network when layers change or when component mounts
  useEffect(() => {
    initializeNetwork()
  }, [layers, initializeNetwork])

  // Re-initialize network when model changes
  useEffect(() => {
    if (model) {
      initializeNetwork()
    }
  }, [model, initializeNetwork])

  // Update connections when training progresses
  useEffect(() => {
    if (model && is_training) {
      // Only recalculate positions for performance reasons when needed
      // The connections are updated in updateWeightsAndBiases
    }
  }, [curr_epoch, is_training, model])

  // Global method for external updates
  useEffect(() => {
    (window as any).updateNeuralNetVisualization = initializeNetwork
    return () => {
      delete (window as any).updateNeuralNetVisualization
    }
  }, [initializeNetwork])

  // Always use the box representation for the input layer regardless of size
  const useInputLayerBox = true
  
  // Determine if we should use batched rendering based on connection count
  // Only use batched rendering for very large connection counts but not for MNIST
  const useBatchedRendering = useMemo(() => {
    return connections.length > 1000 && selectedDataset !== 'mnist';
  }, [connections.length, selectedDataset]);

  // Filter neurons based on the view mode
  const visibleNeurons = useInputLayerBox 
    ? visualNeurons.filter(neuron => neuron.layer !== 0) // Exclude input neurons when using box view
    : visualNeurons // Show all neurons in normal mode

  // For box mode, get the input neurons positions for calculating the box dimensions
  const inputNeurons = useInputLayerBox 
    ? visualNeurons.filter(neuron => neuron.layer === 0)
    : []

  // Filter connections to only show relevant ones
  const visibleConnections = useInputLayerBox
    ? connections.filter(connection => {
        // Only keep connections from input to first hidden layer
        const startNeuron = visualNeurons.find(n => n.id === connection.startNeuronId)
        return startNeuron && startNeuron.layer !== 0
      })
    : connections

  // Create input-to-hidden connections for box mode
  const inputBoxConnections = useInputLayerBox
    ? connections.filter(connection => {
        const startNeuron = visualNeurons.find(n => n.id === connection.startNeuronId)
        const endNeuron = visualNeurons.find(n => n.id === connection.endNeuronId)
        return startNeuron && endNeuron && startNeuron.layer === 0 && endNeuron.layer === 1
      })
    : []

  return (
    <>
      {visibleNeurons.map((neuron) => (
        <Neuron
          key={neuron.id}
          neuron={neuron}
          isRealigning={false}
        />
      ))}
      
      {useInputLayerBox && inputNeurons.length > 0 && (
        <InputLayerBox 
          inputNeurons={inputNeurons}
          connections={inputBoxConnections}
          outputNeurons={visualNeurons.filter(n => n.layer === 1)}
        />
      )}
      
      {/* Use batched connections for large networks, regular connections for small ones */}
      {useBatchedRendering ? (
        <BatchedConnections 
          connections={visibleConnections} 
          neurons={visualNeurons} 
        />
      ) : (
        visibleConnections.map((connection) => (
          <Connection
            key={connection.id}
            connection={connection}
            neurons={visualNeurons}
          />
        ))
      )}
    </>
  )
}