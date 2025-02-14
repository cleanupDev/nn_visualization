import React, { useEffect } from 'react'
import { useModelStore } from '../store'
import Neuron from './neuron'
import Connection from './connection'

export default function NeuralNetwork() {
  const { visualNeurons, connections, layers, initializeNetwork } = useModelStore()

  useEffect(() => {
    initializeNetwork()
  }, [layers, initializeNetwork])

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