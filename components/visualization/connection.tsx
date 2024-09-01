import React, { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { Color } from 'three'
import { Connection as ConnectionType, Neuron as NeuronType } from './neuralNetController'

export default function Connection({ connection, neurons }: { connection: ConnectionType; neurons: NeuronType[] }) {
  const startNeuron = neurons.find(n => n.id === connection.startNeuronId)
  const endNeuron = neurons.find(n => n.id === connection.endNeuronId)

  const color = useMemo(() => {
    return connection.strength >= 0 ? new Color('#2f9e44') : new Color('#e03131')
  }, [connection.strength])

  if (!startNeuron || !endNeuron) {
    return null
  }

  return (
    <Line
      points={[startNeuron.position, endNeuron.position]}
      color={color}
      lineWidth={1 + Math.abs(connection.strength) * 5}
      onClick={() => console.log('Connection clicked | Connection strength:', connection.strength)}
    />
  )
}