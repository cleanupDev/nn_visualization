"use client";

import { create } from 'zustand';
import * as tf from "@tensorflow/tfjs";
import Neuron from './visualization/neuron';
import { MnistData, NUM_TRAIN_ELEMENTS } from '@/lib/mnist'; // Import MnistData and constants
import { createAndCompileModel, InitializerType } from '@/lib/model'; // Update import
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
  createModelAndLoadData: (dataset: 'xor' | 'sine' | 'mnist', initializer?: InitializerType) => Promise<void>; // Updated
  updateWeightsAndBiases: (model: tf.LayersModel) => void; // Add this
  rebuildModelFromLayers: () => void;
  setWeightInitializer: (type: InitializerType) => void; // New
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
  weightInitializer: InitializerType; // New
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
  weightInitializer: 'glorot_uniform', // Default initializer

  // Add setter for weight initializer
  setWeightInitializer: (type: InitializerType) => set({ weightInitializer: type }),

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
  createModelAndLoadData: async (dataset, initializer) => {
    // Load the dataset first
    await get().loadDataset(dataset);
    
    // Get current state after dataset is loaded
    const state = get();
    let inputNeurons = state.input_neurons;
    let outputNeurons = state.output_neurons;
    
    // Use provided initializer or the one from state
    const weightInitializer = initializer || state.weightInitializer;
    
    // Configure network structure based on dataset
    switch (dataset) {
      case 'xor':
        inputNeurons = 2;
        outputNeurons = 1;
        set({ 
          input_neurons: inputNeurons,
          output_neurons: outputNeurons,
          layers: [{ name: 'Hidden Layer 1', neurons: 3 }],
          num_layers: 1
        });
        break;
      case 'sine':
        inputNeurons = 1;
        outputNeurons = 1;
        set({ 
          input_neurons: inputNeurons,
          output_neurons: outputNeurons,
          layers: [{ name: 'Hidden Layer 1', neurons: 5 }],
          num_layers: 1
        });
        break;
      case 'mnist':
        inputNeurons = 784; // 28x28 image
        outputNeurons = 10; // 10 digits
        set({ 
          input_neurons: inputNeurons,
          output_neurons: outputNeurons,
          layers: [
            { name: 'Hidden Layer 1', neurons: 32 },
            { name: 'Hidden Layer 2', neurons: 16 }
          ],
          num_layers: 2
        });
        break;
    }
    
    // Dispose existing model if it exists
    const currentModel = state.model;
    if (currentModel) currentModel.dispose();
    
    // Create the new model with the updated configuration and specified initializer
    const newModel = createAndCompileModel(state.inputShape, weightInitializer);
    
    // Update state with the new model
    set({
      model: newModel,
      curr_acc: 0,
      curr_loss: 0,
      curr_phase: "ready",
      curr_epoch: 0,
      is_training: false
    });
    
    // Get the updated model's weights to initialize neurons
    const modelLayers = newModel.layers;
    const modelNeurons: Neuron[] = [];
    
    // Create input neurons
    for (let i = 0; i < inputNeurons; i++) {
      modelNeurons.push({
        id: `neuron-0-${i}`,
        position: { x: 0, y: 0, z: 0 },
        layer: 0,
        bias: 0,
        weights: [],
        activation: 'linear'
      });
    }
    
    // Create neurons for hidden and output layers
    for (let layerIndex = 1; layerIndex < modelLayers.length; layerIndex++) {
      const layer = modelLayers[layerIndex];
      const weights = layer.getWeights();
      
      if (weights && weights.length >= 2) {
        const weightMatrix = weights[0].arraySync() as number[][];
        const biasArray = weights[1].arraySync() as number[];
        
        for (let i = 0; i < weightMatrix.length; i++) {
          modelNeurons.push({
            id: `neuron-${layerIndex}-${i}`,
            position: { x: 0, y: 0, z: 0 },
            layer: layerIndex,
            bias: biasArray[i],
            weights: weightMatrix[i],
            activation: layerIndex === modelLayers.length - 1 ? 'sigmoid' : 'relu'
          });
        }
      }
    }
    
    // Update the neurons in store
    set({ neurons: modelNeurons });
    
    console.log(`Dataset ${dataset} loaded with ${modelNeurons.length} neurons`);
    
    // Initialize visualization
    get().initializeNetwork();
  },
  updateWeightsAndBiases: (model: tf.LayersModel) => {
    const state = get();
    
    // Clone the neurons array to avoid mutation
    const updatedNeurons = [...state.neurons];
    
    // Get the layers 
    const modelLayers = model.layers;
    
    // Skip the input layer (index 0) as it doesn't have weights
    for (let layerIndex = 1; layerIndex < modelLayers.length; layerIndex++) {
      const layer = modelLayers[layerIndex];
      const weights = layer.getWeights();
      
      if (weights && weights.length >= 2) {
        const weightTensor = weights[0]; // Weights matrix
        const biasTensor = weights[1];   // Biases vector
        
        // Convert tensors to arrays
        const weightMatrix = weightTensor.arraySync() as number[][];
        const biasArray = biasTensor.arraySync() as number[];
        
        // Find neurons in this layer
        const layerNeurons = updatedNeurons.filter(n => n.layer === layerIndex);
        
        // Update each neuron's weights and bias
        layerNeurons.forEach((neuron, neuronIndexInLayer) => {
          if (neuronIndexInLayer < weightMatrix.length && 
              neuronIndexInLayer < biasArray.length) {
            // Update bias
            neuron.bias = biasArray[neuronIndexInLayer];
            
            // Update weights - these are connections from previous layer
            neuron.weights = weightMatrix[neuronIndexInLayer];
            
            // Log for debugging
            console.log(`Updated model neuron ${neuron.id} in layer ${layerIndex}`);
            console.log(`  Bias: ${neuron.bias}`);
            console.log(`  Weights: ${neuron.weights.slice(0, 3)}... (${neuron.weights.length} total)`);
          }
        });
      }
    }
    
    // Update the neurons in the store
    set({ neurons: updatedNeurons });
    
    // Now update the visual neurons to reflect the changes
    const updatedVisualNeurons = [...state.visualNeurons].map(visualNeuron => {
      // Get the neuron ID parts to find the corresponding model neuron
      const [type, layerStr, indexStr] = visualNeuron.id.split('-');
      const layer = parseInt(layerStr);
      
      // Find corresponding model neuron by ID
      const modelNeuron = updatedNeurons.find(n => 
        n.layer === layer && 
        n.id === `neuron-${layer}-${indexStr}`
      );
      
      if (modelNeuron) {
        // Update the visual neuron with model neuron data
        return {
          ...visualNeuron,
          bias: modelNeuron.bias,
          weight: modelNeuron.weights.length > 0 ? 
            modelNeuron.weights.reduce((sum, w) => sum + w, 0) / modelNeuron.weights.length : 
            visualNeuron.weight // Average of weights as a representative value
        };
      }
      
      return visualNeuron;
    });
    
    // Update visual neurons
    set({ visualNeurons: updatedVisualNeurons });
    
    // Update the connections to reflect the new weights
    get().updateConnections();
  },
  initializeNetwork: () => {
    const state = get();
    const visualNeurons: NeuronVisual[] = [];
    const connections: Connection[] = [];
    
    const totalLayers = state.num_layers + 2; // input + hidden layers + output
    
    // Debug log of model neurons to help find the issue
    console.log("Model neurons:", state.neurons.map(n => ({ id: n.id, layer: n.layer })));
    
    // Create input neurons
    for (let i = 0; i < state.input_neurons; i++) {
      // Find the corresponding model neuron
      const modelNeuron = state.neurons.find(n => n.layer === 0 && n.id === `neuron-0-${i}`);
      
      visualNeurons.push({
        id: `input-0-${i}`,
        position: new Vector3(0, 0, 0), // Will be updated by recalculatePositions
        activation: 0.5, // Default activation
        weight: modelNeuron?.weights.length ? 
          modelNeuron.weights.reduce((sum, w) => sum + w, 0) / modelNeuron.weights.length : 
          0, // Use actual weights average if available
        bias: modelNeuron?.bias || 0,
        activationFunction: 'relu',
        layer: 0,
        type: 'input'
      });
    }

    // Create hidden neurons
    state.layers.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.neurons; i++) {
        // Find the corresponding model neuron
        const modelNeuron = state.neurons.find(n => n.layer === layerIndex + 1 && n.id === `neuron-${layerIndex + 1}-${i}`);
        
        visualNeurons.push({
          id: `hidden-${layerIndex + 1}-${i}`,
          position: new Vector3(0, 0, 0), // Will be updated by recalculatePositions
          activation: 0.5, // Default activation
          weight: modelNeuron?.weights.length ? 
            modelNeuron.weights.reduce((sum, w) => sum + w, 0) / modelNeuron.weights.length : 
            0, // Use actual weights average if available
          bias: modelNeuron?.bias || 0,
          activationFunction: 'relu',
          layer: layerIndex + 1,
          type: 'hidden'
        });
      }
    });

    // Create output neurons
    for (let i = 0; i < state.output_neurons; i++) {
      // Find the corresponding model neuron
      const layerIndex = totalLayers - 1;
      const modelNeuron = state.neurons.find(n => n.layer === layerIndex && n.id === `neuron-${layerIndex}-${i}`);
      
      visualNeurons.push({
        id: `output-${layerIndex}-${i}`,
        position: new Vector3(0, 0, 0), // Will be updated by recalculatePositions
        activation: 0.5, // Default activation
        weight: modelNeuron?.weights.length ? 
          modelNeuron.weights.reduce((sum, w) => sum + w, 0) / modelNeuron.weights.length : 
          0, // Use actual weights average if available
        bias: modelNeuron?.bias || 0,
        activationFunction: 'sigmoid',
        layer: layerIndex,
        type: 'output'
      });
    }

    set({ visualNeurons });
    get().recalculatePositions();
    get().updateConnections();
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
    const { visualNeurons, neurons } = state;
    
    console.log(`Updating connections: ${neurons.length} model neurons, ${visualNeurons.length} visual neurons`);
    
    // For each layer except the last, connect to the next layer
    for (let layerIndex = 0; layerIndex < state.num_layers + 1; layerIndex++) {
      const thisLayerNeurons = visualNeurons.filter(n => n.layer === layerIndex);
      const nextLayerNeurons = visualNeurons.filter(n => n.layer === layerIndex + 1);
      
      if (nextLayerNeurons.length === 0) continue;
      
      // For each neuron in the next layer, create connections from previous layer
      nextLayerNeurons.forEach(endNeuron => {
        // Get the neuron ID parts to find the corresponding model neuron
        const [endType, endLayer, endIndex] = endNeuron.id.split('-');
        
        // Find the model neuron that corresponds to this visual neuron
        const modelNeuron = neurons.find(n => 
          n.layer === parseInt(endLayer) && 
          n.id === `neuron-${endLayer}-${endIndex}`
        );
        
        if (!modelNeuron) {
          console.warn(`Could not find model neuron for visual neuron ${endNeuron.id}`);
        }
        
        // Connect to each neuron in the previous layer
        thisLayerNeurons.forEach((startNeuron, startIndex) => {
          // Default to neutral weight if we can't find a specific weight
          let weight = 0;
          let connectionStrength = 0.5;
          
          // If we found the model neuron and it has weights
          if (modelNeuron && modelNeuron.weights && modelNeuron.weights.length > startIndex) {
            // Get the weight from the model neuron
            weight = modelNeuron.weights[startIndex];
            
            // Convert to a visualization-friendly value (0-1 range)
            // Using sigmoid to normalize: 1 / (1 + e^-x)
            connectionStrength = 1 / (1 + Math.exp(-3 * weight)); // Multiply by 3 to increase contrast
            
            // Debug logging for some connections
            if (startIndex === 0 && parseInt(endLayer) === 1) {
              console.log(`Connection weight: layer ${layerIndex} → ${layerIndex+1}, raw: ${weight.toFixed(4)}, visual: ${connectionStrength.toFixed(4)}`);
            }
          } else if (modelNeuron) {
            console.warn(`Model neuron ${modelNeuron.id} doesn't have enough weights for neuron at index ${startIndex}`);
          }
          
          // Create the connection
          connections.push({
            id: `${startNeuron.id}-to-${endNeuron.id}`,
            startNeuronId: startNeuron.id,
            endNeuronId: endNeuron.id,
            strength: connectionStrength
          });
        });
      });
    }
    
    // Log connection summary
    console.log(`Updated ${connections.length} connections`);
    
    // Update the store
    set({ connections });
  },
  rebuildModelFromLayers: () => {
    const state = get();
    
    // Don't proceed if there's no selected dataset or training data
    if (!state.selectedDataset || !state.trainingData) {
      return;
    }
    
    // Dispose existing model if it exists
    if (state.model) {
      state.model.dispose();
    }
    
    // Create new model with current layer configuration and weight initializer
    const newModel = createAndCompileModel(state.inputShape, state.weightInitializer);
    
    // Update state with new model
    set({
      model: newModel,
      curr_acc: 0,
      curr_loss: 0,
      curr_phase: "ready",
    });
    
    // Initialize visualization
    get().initializeNetwork();
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
