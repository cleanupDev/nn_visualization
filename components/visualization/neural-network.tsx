import React, { useEffect, useMemo, useCallback } from 'react'
import { useModelStore } from '../store'
import Neuron from './neuron'
import Connection from './connection'
import InputLayerBox from './input-layer-box'
import BatchedConnections from './batched-connections'

// Create a memoized NeuralNetwork component to prevent unnecessary renders
const NeuralNetwork = React.memo(() => {
  // Use selective state subscription for better performance
  const visualNeurons = useModelStore(state => state.visualNeurons)
  const connections = useModelStore(state => state.connections)
  const layers = useModelStore(state => state.layers)
  const initializeNetwork = useModelStore(state => state.initializeNetwork)
  const model = useModelStore(state => state.model)
  const curr_epoch = useModelStore(state => state.curr_epoch)
  const is_training = useModelStore(state => state.is_training)
  const input_neurons = useModelStore(state => state.input_neurons)
  const selectedDataset = useModelStore(state => state.selectedDataset)

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

  // Update connections when training progresses - only when needed
  useEffect(() => {
    if (model && is_training) {
      // We don't need to do anything here as connections are updated in the store
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
  
  // Determine if we should use batched rendering based on connection count and dataset
  const useBatchedRendering = useMemo(() => {
    // Always use batched rendering for large networks (> 1000 connections)
    const isLargeNetwork = connections.length > 1000;
    
    // For MNIST specifically, we need special handling
    if (selectedDataset === 'mnist') {
      // For MNIST, use individual connection components for better render quality
      // MNIST datasets appear to render more correctly with the Line component
      return false; // Disable batched rendering for MNIST to fix rendering issues
    }
    
    return isLargeNetwork;
  }, [connections.length, selectedDataset]);

  // Filter neurons based on the view mode - memoized for performance
  const visibleNeurons = useMemo(() => {
    return useInputLayerBox 
      ? visualNeurons.filter(neuron => neuron.layer !== 0) // Exclude input neurons when using box view
      : visualNeurons; // Show all neurons in normal mode
  }, [visualNeurons, useInputLayerBox]);

  // For box mode, get the input neurons positions for calculating the box dimensions
  const inputNeurons = useMemo(() => {
    return useInputLayerBox 
      ? visualNeurons.filter(neuron => neuron.layer === 0)
      : [];
  }, [visualNeurons, useInputLayerBox]);

  // Filter connections to only show relevant ones
  const visibleConnections = useMemo(() => {
    if (!useInputLayerBox) return connections;
    
    return connections.filter(connection => {
      // Only keep connections from input to first hidden layer
      const startNeuron = visualNeurons.find(n => n.id === connection.startNeuronId);
      const endNeuron = visualNeurons.find(n => n.id === connection.endNeuronId);
      
      // For MNIST, we need to ensure that the neuron lookup is successful
      if (!startNeuron || !endNeuron) return false;
      
      return startNeuron.layer !== 0;
    });
  }, [connections, visualNeurons, useInputLayerBox, selectedDataset]);

  // Create input-to-hidden connections for box mode
  const inputBoxConnections = useMemo(() => {
    if (!useInputLayerBox) return [];
    
    return connections.filter(connection => {
      const startNeuron = visualNeurons.find(n => n.id === connection.startNeuronId);
      const endNeuron = visualNeurons.find(n => n.id === connection.endNeuronId);
      
      // Make sure both neurons exist before proceeding
      if (!startNeuron || !endNeuron) return false;
      
      return startNeuron.layer === 0 && endNeuron.layer === 1;
    });
  }, [connections, visualNeurons, useInputLayerBox]);

  // Calculate the output neurons once for the InputLayerBox component
  const outputNeurons = useMemo(() => {
    return visualNeurons.filter(n => n.layer === 1);
  }, [visualNeurons]);

  // Skip rendering if no neurons - performance optimization
  if (visualNeurons.length === 0) return null;

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
          outputNeurons={outputNeurons}
        />
      )}
      
      {/* Always use individual connections for MNIST, batched for others */}
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
});

// Display name for debugging
NeuralNetwork.displayName = 'NeuralNetwork';

export default NeuralNetwork;