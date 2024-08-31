import { Vector3 } from 'three'

export interface Neuron {
  id: string
  position: Vector3
  activation: number
  layer: number
}

export interface Connection {
  id: string
  startNeuronId: string
  endNeuronId: string
  strength: number
}

export class NeuralNetController {
  private neurons: Neuron[] = []
  private connections: Connection[] = []
  private layers: number[] = []

  constructor(initialLayers: number[]) {
    this.layers = initialLayers
    this.initializeNetwork()
  }

  private initializeNetwork() {
    let neuronId = 0
    const spacing = 2
    const totalLayers = this.layers.length

    this.layers.forEach((neurons, layerIndex) => {
      const layerOffset = (totalLayers - 1) / 2 - layerIndex
      for (let i = 0; i < neurons; i++) {
        const verticalOffset = (neurons - 1) / 2 - i
        this.neurons.push({
          id: `neuron-${neuronId++}`,
          position: new Vector3(layerOffset * spacing, verticalOffset * spacing, 0),
          activation: Math.random(),
          layer: layerIndex
        })
      }
    })

    this.updateConnections()
  }

  private updateConnections() {
    this.connections = []
    let connectionId = 0
    let currentIndex = 0

    for (let i = 0; i < this.layers.length - 1; i++) {
      for (let j = 0; j < this.layers[i]; j++) {
        const startNeuronIndex = currentIndex + j
        for (let k = 0; k < this.layers[i + 1]; k++) {
          const endNeuronIndex = currentIndex + this.layers[i] + k
          const startNeuron = this.neurons[startNeuronIndex]
          const endNeuron = this.neurons[endNeuronIndex]
          const strength = (startNeuron.activation + endNeuron.activation) / 2
          this.connections.push({
            id: `connection-${connectionId++}`,
            startNeuronId: startNeuron.id,
            endNeuronId: endNeuron.id,
            strength
          })
        }
      }
      currentIndex += this.layers[i]
    }
  }

  getNeurons(): Neuron[] {
    return this.neurons
  }

  getConnections(): Connection[] {
    return this.connections
  }

  addNeuron(layer: number) {
    if (layer < 0 || layer >= this.layers.length) {
      throw new Error('Invalid layer')
    }

    const newNeuronId = `neuron-${this.neurons.length}`
    const layerNeurons = this.neurons.filter(n => n.layer === layer)
    const spacing = 2
    const layerOffset = (this.layers.length - 1) / 2 - layer
    const verticalOffset = layerNeurons.length / 2

    const newNeuron: Neuron = {
      id: newNeuronId,
      position: new Vector3(layerOffset * spacing, verticalOffset * spacing, 0),
      activation: Math.random(),
      layer
    }

    this.neurons.push(newNeuron)
    this.layers[layer]++
    this.updateConnections()

    return newNeuron
  }

  removeNeuron(neuronId: string) {
    const index = this.neurons.findIndex(n => n.id === neuronId)
    if (index === -1) {
      throw new Error('Neuron not found')
    }

    const removedNeuron = this.neurons.splice(index, 1)[0]
    this.layers[removedNeuron.layer]--
    this.updateConnections()

    return removedNeuron
  }

  updateNeuronPosition(neuronId: string, newPosition: Vector3) {
    const neuron = this.neurons.find(n => n.id === neuronId)
    if (!neuron) {
      throw new Error('Neuron not found')
    }

    neuron.position = newPosition
  }

  updateNeuronActivation(neuronId: string, newActivation: number) {
    const neuron = this.neurons.find(n => n.id === neuronId)
    if (!neuron) {
      throw new Error('Neuron not found')
    }

    neuron.activation = newActivation
    this.updateConnections()
  }
}