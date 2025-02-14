"use client";

import { create } from 'zustand';
import * as tf from "@tensorflow/tfjs";
import Neuron from './visualization/neuron';
import { MnistData, NUM_TRAIN_ELEMENTS } from '@/lib/mnist'; // Import MnistData and constants
import { createAndCompileModel } from '@/lib/model'; // Import
import { Vector3 } from 'three';

interface ModelActions {
  setModel: (model: tf.LayersModel | null) => void;
  setNumNeurons: (num: number) => void;
  setNumLayers: (num: number) => void;
  setLayers: (layers: { name: string; neurons: number }[]) => void;
  setNumParams: (num: number | string) => void;
  setCurrAcc: (num: number | string) => void;
  setCurrLoss: (num: number | string) => void;
  setCurrPhase: (phase: string) => void;
  setCurrEpoch: (num: number) => void;
  setIsTraining: (isTraining: boolean) => void;
  updateNumParams: () => void;
  resetModelData: () => void;
  setNeurons: (updater: (prevNeurons: Neuron[]) => Neuron[]) => void;
  addNeuron: (layer: number) => void;
  removeNeuron: (neuronId: string) => void;
  loadDataset: (datasetName: 'xor' | 'sine' | 'mnist') => Promise<void>; // New
  setInputShape: (shape: number[]) => void; // New
  setTrainingData: (data: { xs: tf.Tensor; ys: tf.Tensor } | null) => void; // New
  createModelAndLoadData: (dataset: 'xor' | 'sine' | 'mnist') => Promise<void>; // Add this
  updateWeightsAndBiases: (model: tf.LayersModel) => void; // Add this
}

interface ModelInfo {
  model: tf.LayersModel | null;
  input_neurons: number;
  output_neurons: number;
  num_neurons: number;
  num_layers: number;
  layers: { name: string; neurons: number }[];
  num_params: number | string;
  curr_acc: number | string;
  curr_loss: number | string;
  curr_phase: string;
  curr_epoch: number;
  is_training: boolean;
  inputShape: number[];
  neurons: Neuron[];
  selectedDataset: 'xor' | 'sine' | 'mnist' | null; // New
  trainingData: { xs: tf.Tensor; ys: tf.Tensor } | null; // New
}

export interface Neuron {
  id: string;
  position: { x: number; y: number; z: number };
  layer: number;
  bias: number;
  weights: number[];
  activation: string;
}

export interface NeuronVisual {
  id: string;
  position: Vector3;
  activation: number;
  weight: number;
  bias: number;
  activationFunction: 'sigmoid' | 'relu' | 'tanh';
  layer: number;
  type: 'hidden' | 'input' | 'output';
}

export interface Connection {
  id: string;
  startNeuronId: string;
  endNeuronId: string;
  strength: number;
}

type ModelStore = ModelInfo & ModelActions & {
  // Visualization state
  visualNeurons: NeuronVisual[];
  connections: Connection[];
  // Visualization actions
  initializeNetwork: () => void;
  recalculatePositions: () => void;
  updateConnections: () => void;
};

export const useModelStore = create<ModelStore>((set, get) => ({
  model: null,
  input_neurons: 2,
  output_neurons: 1,
  num_neurons: 3, // 2 input + 1 output
  num_layers: 1, // Only count hidden layers
  layers: [], // Start with no hidden layers
  num_params: "N/A",
  curr_acc: "N/A",
  curr_loss: "N/A",
  curr_phase: "training",
  curr_epoch: 0,
  is_training: false,
  inputShape: [2], // Default input shape
  neurons: [],
  selectedDataset: null, // Initial dataset
  trainingData: null, // Initial training data
  visualNeurons: [],
  connections: [],
  setModel: (model: tf.LayersModel | null) => set({ model }),
  setNumNeurons: (num: number) => set({ num_neurons: num }),
  setNumLayers: (num: number) => set({ num_layers: num }),
  setLayers: (layers: { name: string; neurons: number }[]) => set({ layers }),
  setNumParams: (num: string | number) => set({ num_params: num }),
  setCurrAcc: (num: string | number) => set({ curr_acc: num }),
  setCurrLoss: (num: string | number) => set({ curr_loss: num }),
  setCurrPhase: (phase: string) => set({ curr_phase: phase }),
  setCurrEpoch: (num: number) => set({ curr_epoch: num }),
  setIsTraining: (isTraining: boolean) => set({ is_training: isTraining }),
  updateNumParams: () => {
    set((state) => {
      let totalParams = 0;
      for (let layer of state.layers) {
        totalParams += layer.neurons;
      }
      return { num_params: totalParams };
    });
  },
  resetModelData: () => {
    set({
      model: null,
      num_params: "N/A",
      curr_acc: "N/A",
      curr_loss: "N/A",
      curr_phase: "training",
      curr_epoch: 0,
    });
  },
  setNeurons: (updater) => set((state) => ({ neurons: updater(state.neurons) })),
  addNeuron: (layer: number) => set((state) => {
    const newLayers = [...state.layers];
    if (layer >= 0 && layer < newLayers.length) {
      newLayers[layer].neurons++;
      const newNeuron: Neuron = {
        id: `neuron-${state.neurons.length}`,
        position: { x: 0, y: 0, z: 0 }, // Initial position, will be recalculated
        layer,
        bias: 0, // Math.random() - 0.5,
        weights: [],
        activation: 'relu', // Default activation, adjust as needed
      };
      return {
        layers: newLayers,
        neurons: [...state.neurons, newNeuron],
      };
    }
    return state;
  }),
  removeNeuron: (neuronId: string) => set((state) => {
    const neuronIndex = state.neurons.findIndex(n => n.id === neuronId);
    if (neuronIndex === -1) return state;

    const neuron = state.neurons[neuronIndex];
    const newLayers = [...state.layers];
    newLayers[neuron.layer].neurons--;

    return {
      layers: newLayers,
      neurons: state.neurons.filter(n => n.id !== neuronId),
    };
  }),
  loadDataset: async (datasetName) => {
    switch (datasetName) {
      case 'xor':
        const xorInputs = tf.tensor2d([
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ]);
        const xorLabels = tf.tensor1d([0, 1, 1, 0], 'int32');
        set({
          trainingData: { xs: xorInputs, ys: xorLabels },
          selectedDataset: 'xor',
          inputShape: [2], // Update input shape
        });
        break;

      case 'sine':
        const { xs: sineXs, ys: sineYs } = generateSineWaveData(100);
        const sineInputs = tf.tensor1d(sineXs);
        const sineLabels = tf.tensor1d(sineYs);
        set({
          trainingData: { xs: sineInputs, ys: sineLabels },
          selectedDataset: 'sine',
          inputShape: [1], // Update input shape
        });
        break;

      case 'mnist':
        try {
          const mnist = new MnistData();
          await mnist.load();

          // Get the entire training set as a single batch
          const { xs: mnistInputs, labels: mnistLabels } = mnist.nextTrainBatch(
            NUM_TRAIN_ELEMENTS
          );

          set({
            trainingData: { xs: mnistInputs, ys: mnistLabels },
            selectedDataset: 'mnist',
            inputShape: [784], // Update input shape for MNIST
          });
        } catch (error) {
          console.error('Error loading MNIST:', error);
          // Handle error appropriately (e.g., display an error message)
        }
        break;

      default:
        console.warn(`Unknown dataset: ${datasetName}`);
        break;
    }
  },
  setInputShape: (shape: number[]) => set({ inputShape: shape }), // New
  setTrainingData: (data: { xs: tf.Tensor; ys: tf.Tensor } | null) => set({ trainingData: data }), // New
  createModelAndLoadData: async (dataset) => {
    // Load the dataset first
    await get().loadDataset(dataset);

    // Then create the model
    const currentModel = get().model;
    if (currentModel) currentModel.dispose();
    const newModel = createAndCompileModel(get().inputShape); // Pass inputShape
    set({
      model: newModel,
      curr_acc: 0,
      curr_loss: 0,
      curr_phase: "training",
      curr_epoch: 0
    });
    get().updateWeightsAndBiases(newModel); // Assuming you add this back to the store
  },
  updateWeightsAndBiases: (model: tf.LayersModel) => {
    model.layers.forEach((layer) => {
      const weights = layer.getWeights()[0];
      const biases = layer.getWeights()[1];
      if (weights && biases) {
        set((state) => ({
          neurons: state.neurons.map((neuron, neuronIndex) => {
            const weightData = weights.arraySync() as number[][];
            const biasData = biases.arraySync() as number[];
            return {
              ...neuron,
              weights: weightData[neuronIndex] || neuron.weights, // Keep existing weights if not in this layer
              bias: biasData[neuronIndex] || neuron.bias, // Keep existing bias if not in this layer
            };
          }),
        }));
      }
    });
  },
  initializeNetwork: () => {
    const state = get();
    const neurons: NeuronVisual[] = [];
    
    // Create input neurons
    for (let i = 0; i < state.input_neurons; i++) {
      neurons.push({
        id: `input-0-${i}`,
        position: new Vector3(0, 0, 0),
        activation: Math.random(),
        weight: Math.random(),
        bias: Math.random(),
        activationFunction: 'relu',
        layer: 0,
        type: 'input'
      });
    }

    // Create hidden neurons
    state.layers.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.neurons; i++) {
        neurons.push({
          id: `hidden-${layerIndex + 1}-${i}`,
          position: new Vector3(0, 0, 0),
          activation: Math.random(),
          weight: Math.random(),
          bias: Math.random(),
          activationFunction: 'relu',
          layer: layerIndex + 1,
          type: 'hidden'
        });
      }
    });

    // Create output neurons
    for (let i = 0; i < state.output_neurons; i++) {
      neurons.push({
        id: `output-${state.layers.length + 1}-${i}`,
        position: new Vector3(0, 0, 0),
        activation: Math.random(),
        weight: Math.random(),
        bias: Math.random(),
        activationFunction: 'sigmoid',
        layer: state.layers.length + 1,
        type: 'output'
      });
    }

    set({ visualNeurons: neurons });
    get().recalculatePositions();
  },
  recalculatePositions: () => {
    const state = get();
    const spacing = 2;
    const totalLayers = state.layers.length + 2; // input + hidden layers + output
    const newNeurons = [...state.visualNeurons];

    let currentNeuronIndex = 0;
    const positionNeuronsInLayer = (neuronsInLayer: number, layerIndex: number) => {
      const layerOffset = layerIndex - (totalLayers - 1) / 2;
      for (let i = 0; i < neuronsInLayer; i++) {
        const verticalOffset = (neuronsInLayer - 1) / 2 - i;
        newNeurons[currentNeuronIndex + i].position = new Vector3(
          layerOffset * spacing,
          verticalOffset * spacing,
          0
        );
      }
      currentNeuronIndex += neuronsInLayer;
    };

    // Position all layers
    positionNeuronsInLayer(state.input_neurons, 0);
    state.layers.forEach((layer, idx) => positionNeuronsInLayer(layer.neurons, idx + 1));
    positionNeuronsInLayer(state.output_neurons, totalLayers - 1);

    set({ visualNeurons: newNeurons });
    get().updateConnections();
  },
  updateConnections: () => {
    const state = get();
    const connections: Connection[] = [];
    let connectionId = 0;
    const allLayers = [state.input_neurons, ...state.layers.map(l => l.neurons), state.output_neurons];

    for (let i = 0; i < allLayers.length - 1; i++) {
      const startLayer = allLayers[i];
      const endLayer = allLayers[i + 1];
      const startOffset = allLayers.slice(0, i).reduce((sum, n) => sum + n, 0);
      const endOffset = startOffset + startLayer;

      for (let j = 0; j < startLayer; j++) {
        for (let k = 0; k < endLayer; k++) {
          const startNeuron = state.visualNeurons[startOffset + j];
          const endNeuron = state.visualNeurons[endOffset + k];
          connections.push({
            id: `connection-${connectionId++}`,
            startNeuronId: startNeuron.id,
            endNeuronId: endNeuron.id,
            strength: endNeuron.activation
          });
        }
      }
    }

    set({ connections });
  },
}));

// Helper function for sine wave data
function generateSineWaveData(numPoints: number): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < numPoints; i++) {
    const x = (i / numPoints) * Math.PI * 2;
    const y = Math.sin(x);
    xs.push(x);
    ys.push(y);
  }
  return { xs, ys };
}
