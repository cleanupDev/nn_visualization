import { Vector3 } from 'three'
import { useModelStore } from '../store'

export interface Neuron {
  id: string
  position: Vector3
  activation: number
  weight: number
  bias: number
  activationFunction: 'sigmoid' | 'relu' | 'tanh'
  layer: number
  type: 'hidden' | 'input' | 'output'
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

  constructor() {
    this.initializeNetwork()
  }

  private initializeNetwork() {
    const { layers, input_neurons, output_neurons } = useModelStore.getState()
    this.neurons = []

    // Create input neurons
    for (let i = 0; i < input_neurons; i++) {
      this.neurons.push(this.createNeuron(i, 0, 'input'))
    }

    // Create hidden neurons
    layers.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.neurons; i++) {
        this.neurons.push(this.createNeuron(i, layerIndex + 1, 'hidden'))
      }
    })

    // Create output neurons
    for (let i = 0; i < output_neurons; i++) {
      this.neurons.push(this.createNeuron(i, layers.length + 1, 'output'))
    }

    this.recalculatePositions()
  }

  private createNeuron(index: number, layer: number, type: 'input' | 'hidden' | 'output'): Neuron {
    return {
      id: `${type}-${layer}-${index}`,
      position: new Vector3(0, 0, 0),
      activation: Math.random(),
      weight: Math.random(),
      bias: Math.random(),
      activationFunction: 'relu',
      layer,
      type
    }
  }

  private recalculatePositions() {
    const { layers, input_neurons, output_neurons } = useModelStore.getState()
    const spacing = 2
    const totalLayers = layers.length + 2 // input + hidden layers + output

    let currentNeuronIndex = 0

    // Position input neurons (now on the left)
    this.positionNeuronsInLayer(input_neurons, 0, totalLayers, spacing, currentNeuronIndex)
    currentNeuronIndex += input_neurons

    // Position hidden neurons
    layers.forEach((layer, layerIndex) => {
      this.positionNeuronsInLayer(layer.neurons, layerIndex + 1, totalLayers, spacing, currentNeuronIndex)
      currentNeuronIndex += layer.neurons
    })

    // Position output neurons (now on the right)
    this.positionNeuronsInLayer(output_neurons, totalLayers - 1, totalLayers, spacing, currentNeuronIndex)

    this.updateConnections()
  }

  private positionNeuronsInLayer(neuronsInLayer: number, layerIndex: number, totalLayers: number, spacing: number, startIndex: number) {
    // Reverse the x-position calculation
    const layerOffset = layerIndex - (totalLayers - 1) / 2
    for (let i = 0; i < neuronsInLayer; i++) {
      const verticalOffset = (neuronsInLayer - 1) / 2 - i
      const newPosition = new Vector3(layerOffset * spacing, verticalOffset * spacing, 0)
      this.neurons[startIndex + i].position = newPosition
    }
  }

  private updateConnections() {
    this.connections = []
    let connectionId = 0
    const { layers, input_neurons, output_neurons } = useModelStore.getState()
    const allLayers = [input_neurons, ...layers.map(l => l.neurons), output_neurons]

    for (let i = 0; i < allLayers.length - 1; i++) {
      const startLayer = allLayers[i]
      const endLayer = allLayers[i + 1]
      const startOffset = allLayers.slice(0, i).reduce((sum, n) => sum + n, 0)
      const endOffset = startOffset + startLayer

      for (let j = 0; j < startLayer; j++) {
        for (let k = 0; k < endLayer; k++) {
          const startNeuron = this.neurons[startOffset + j]
          const endNeuron = this.neurons[endOffset + k]
          const strength = endNeuron.activation //(startNeuron.activation + endNeuron.activation) / 2
          this.connections.push({
            id: `connection-${connectionId++}`,
            startNeuronId: startNeuron.id,
            endNeuronId: endNeuron.id,
            strength
          })
        }
      }
    }
  }

  getNeurons(): Neuron[] {
    return this.neurons
  }

  getConnections(): Connection[] {
    return this.connections
  }

  // ... (keep other methods like updateNeuronPosition, updateNeuronActivation)

  // Remove addNeuron and removeNeuron methods as they should be handled by the store

  updateFromStore() {
    this.initializeNetwork()
  }
}