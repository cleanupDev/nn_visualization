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
    this.neurons = []
    this.recalculatePositions()
  }

  private recalculatePositions() {
    const spacing = 2
    const totalLayers = this.layers.length

    let currentNeuronIndex = 0
    this.layers.forEach((neuronsInLayer, layerIndex) => {
      const layerOffset = (totalLayers - 1) / 2 - layerIndex
      for (let i = 0; i < neuronsInLayer; i++) {
        const verticalOffset = (neuronsInLayer - 1) / 2 - i
        const newPosition = new Vector3(layerOffset * spacing, verticalOffset * spacing, 0)
        
        if (currentNeuronIndex < this.neurons.length) {
          // Update existing neuron position
          this.neurons[currentNeuronIndex].position = newPosition
        } else {
          // Add new neuron
          this.neurons.push({
            id: `neuron-${currentNeuronIndex}`,
            position: newPosition,
            activation: Math.random(),
            layer: layerIndex
          })
        }
        currentNeuronIndex++
      }
    })

    // Remove any excess neurons
    if (currentNeuronIndex < this.neurons.length) {
      this.neurons.splice(currentNeuronIndex)
    }

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

    this.layers[layer]++
    this.recalculatePositions()
    return this.neurons[this.neurons.length - 1]
  }

  removeNeuron(neuronId: string) {
    const index = this.neurons.findIndex(n => n.id === neuronId)
    if (index === -1) {
      throw new Error('Neuron not found')
    }

    const removedNeuron = this.neurons[index]
    this.layers[removedNeuron.layer]--
    this.recalculatePositions()

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