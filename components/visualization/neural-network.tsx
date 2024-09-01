import React, { useState, useCallback, useEffect } from 'react'
import { NeuralNetController, Neuron as NeuronType, Connection as ConnectionType } from './neuralNetController'
import Neuron from './neuron'
import Connection from './connection'
import { useModelStore } from '../store'

export default function NeuralNetwork({ controller }: { controller: NeuralNetController }) {
  const [neurons, setNeurons] = useState(controller.getNeurons())
  const [connections, setConnections] = useState(controller.getConnections())
  const { layers } = useModelStore()

  const updateVisualization = useCallback(() => {
    controller.updateFromStore()
    setNeurons(controller.getNeurons())
    setConnections(controller.getConnections())
  }, [controller])

  useEffect(() => {
    updateVisualization()
  }, [layers, updateVisualization])

  useEffect(() => {
    (window as any).updateNeuralNetVisualization = updateVisualization
    return () => {
      delete (window as any).updateNeuralNetVisualization
    }
  }, [updateVisualization])

  return (
    <>
      {neurons.map((neuron) => (
        <Neuron
          key={neuron.id}
          neuron={neuron}
          //onDrag={(newPosition) => updateNeuronPosition(neuron.id, newPosition)}
          isRealigning={false}
        />
      ))}
      {connections.map((connection) => (
        <Connection
          key={connection.id}
          connection={connection}
          neurons={neurons}
        />
      ))}
    </>
  )
}