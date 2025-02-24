import React, { useEffect } from 'react'
import { useModelStore } from '../store'
import Neuron from './neuron'
import Connection from './connection'

export default function NeuralNetwork() {
  const { 
    visualNeurons, 
    connections, 
    layers, 
    initializeNetwork,
    model,
    curr_epoch,
    is_training 
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

  return (
    <>
      {visualNeurons.map((neuron) => (
        <Neuron
          key={neuron.id}
          neuron={neuron}
          isRealigning={false}
        />
      ))}
      {connections.map((connection) => (
        <Connection
          key={connection.id}
          connection={connection}
          neurons={visualNeurons}
        />
      ))}
    </>
  )
}