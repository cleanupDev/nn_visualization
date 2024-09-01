import { Vector3 } from 'three'
import { useModelStore } from '../store'

export interface Neuron {
  id: string
  position: Vector3
  activation: number
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
    const { layers, neurons, input_neurons, output_neurons } = useModelStore.getState()
    
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
      layer,
      type
    }
  }

  private getNeuronType(layer: number, totalLayers: number): 'input' | 'hidden' | 'output' {
    if (layer === 0) return 'input'
    if (layer === totalLayers - 1) return 'output'
    return 'hidden'
  }

  private recalculatePositions() {
    const { layers } = useModelStore.getState()
    const spacing = 2
    const totalLayers = layers.length

    let currentNeuronIndex = 0
    layers.forEach((layer, layerIndex) => {
      const neuronsInLayer = layer.neurons
      const layerOffset = (totalLayers - 1) / 2 - layerIndex
      for (let i = 0; i < neuronsInLayer; i++) {
        const verticalOffset = (neuronsInLayer - 1) / 2 - i
        const newPosition = new Vector3(layerOffset * spacing, verticalOffset * spacing, 0)
        
        if (currentNeuronIndex < this.neurons.length) {
          this.neurons[currentNeuronIndex].position = newPosition
        }
        currentNeuronIndex++
      }
    })

    this.updateConnections()
  }

  private updateConnections() {
    this.connections = []
    let connectionId = 0
    let currentIndex = 0
    const { layers } = useModelStore.getState()

    for (let i = 0; i < layers.length - 1; i++) {
      for (let j = 0; j < layers[i].neurons; j++) {
        const startNeuronIndex = currentIndex + j
        for (let k = 0; k < layers[i + 1].neurons; k++) {
          const endNeuronIndex = currentIndex + layers[i].neurons + k
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
      currentIndex += layers[i].neurons
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