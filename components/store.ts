"use client";

import { create } from 'zustand';
import * as tf from "@tensorflow/tfjs";
import Neuron from './visualization/neuron';
import { MnistData, NUM_TRAIN_ELEMENTS } from '@/lib/mnist'; // Import MnistData and constants
import { createAndCompileModel } from '@/lib/model'; // Updated import without InitializerType
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
  loadDataset: (datasetName: 'xor' | 'sine' | 'mnist') => Promise<void>;
  setInputShape: (shape: number[]) => void;
  setTrainingData: (data: { xs: tf.Tensor; ys: tf.Tensor } | null) => void;
  createModelAndLoadData: (dataset: 'xor' | 'sine' | 'mnist') => Promise<void>; // Updated
  updateWeightsAndBiases: (model: tf.LayersModel) => void;
  rebuildModelFromLayers: () => void;
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
  selectedDataset: 'xor' | 'sine' | 'mnist' | null;
  trainingData: { xs: tf.Tensor; ys: tf.Tensor } | null;
  currentOptimizer: string;
  currentLossFunction: string;
  learningRate: number;
  momentumValue: number | null; // Only used for SGD with momentum
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
  // Add isWindowOpen flag for selective history tracking
  isWindowOpen?: boolean;
  // Add a more robust weight history tracking
  weightHistory?: number[];
  biasHistory?: number[];
  activationHistory?: number[];
}

export interface Connection {
  id: string;
  startNeuronId: string;
  endNeuronId: string;
  strength: number;
  rawWeight: number;
}

type ModelStore = ModelInfo & ModelActions & {
  // Visualization state
  visualNeurons: NeuronVisual[];
  connections: Connection[];
  // Add a cache for fallback weights to prevent re-randomizing
  fallbackWeightsCache: Record<string, number>;
  // Camera settings
  cameraType: "perspective" | "orthographic";
  setCameraType: (type: "perspective" | "orthographic") => void;
  // Visualization actions
  initializeNetwork: () => void;
  recalculatePositions: () => void;
  updateConnections: () => void;
  // Add a new action to toggle window state
  toggleNeuronWindow: (neuronId: string, isOpen: boolean) => void;
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
  // Add cache for fallback weights
  fallbackWeightsCache: {},
  // Add camera type state
  cameraType: "perspective",
  setCameraType: (type) => set({ cameraType: type }),
  currentOptimizer: "N/A",
  currentLossFunction: "N/A",
  learningRate: 0.01,
  momentumValue: null,

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
      fallbackWeightsCache: {} // Clear cache on reset
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
        bias: Math.random() * 0.2 - 0.1, // Random bias between -0.1 and 0.1
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
    // Dispose any existing training data tensors to free up memory
    const { trainingData } = get();
    if (trainingData) {
      if (trainingData.xs) trainingData.xs.dispose();
      if (trainingData.ys) trainingData.ys.dispose();
    }
    
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

          // Use a smaller subset of MNIST for better performance
          // 5000 samples is enough for visualization and still trains well
          const batchSize = 5000; 
          const { xs: mnistInputs, labels: mnistLabels } = mnist.nextTrainBatch(batchSize);

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
  setInputShape: (shape: number[]) => set({ inputShape: shape }),
  setTrainingData: (data: { xs: tf.Tensor; ys: tf.Tensor } | null) => set({ trainingData: data }),
  createModelAndLoadData: async (dataset) => {
    // Clear the fallback weights cache
    set({ 
      fallbackWeightsCache: {},
      currentOptimizer: "N/A", // Reset optimizer info
      currentLossFunction: "N/A", // Reset loss function info
      learningRate: 0.01, // Reset learning rate
      momentumValue: null // Reset momentum
    });
    
    // Load the dataset first
    await get().loadDataset(dataset);
    
    // Get current state after dataset is loaded
    const state = get();
    let inputNeurons = state.input_neurons;
    let outputNeurons = state.output_neurons;
    
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
            // Use a more efficient architecture for MNIST
            // Smaller hidden layers reduce visualization overhead while
            // maintaining good accuracy
            { name: 'Hidden Layer 1', neurons: 16 },
            { name: 'Hidden Layer 2', neurons: 10 }
          ],
          num_layers: 2
        });
        break;
    }
    
    // Dispose existing model if it exists
    const currentModel = state.model;
    if (currentModel) currentModel.dispose();
    
    // Create the new model with the updated configuration
    // This will also create and initialize the neurons with random weights
    const newModel = createAndCompileModel(state.inputShape);
    
    // Update state with the new model
    set({
      model: newModel,
      curr_acc: 0,
      curr_loss: 0,
      curr_phase: "ready",
      curr_epoch: 0,
      is_training: false
    });
    
    console.log(`Model created for dataset: ${dataset}, now initializing visualization`);
    
    // Initialize visualization - this will create visual neurons based on model neurons
    get().initializeNetwork();
  },
  updateWeightsAndBiases: (model: tf.LayersModel) => {
    const state = get();
    
    // Clone the neurons array to avoid mutation
    const updatedNeurons = [...state.neurons];
    
    // Get the layers 
    const modelLayers = model.layers;
    
    console.log("Updating weights from model with layers:", modelLayers.length);
    
    // Track if weights change across epochs
    let weightsChanged = false;
    
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
        
        console.log(`Layer ${layerIndex} weights:`, {
          shape: weightTensor.shape,
          neurons: weightMatrix.length,
          weightsPerNeuron: weightMatrix[0]?.length || 0
        });
        
        // Find neurons in this layer
        const layerNeurons = updatedNeurons.filter(n => n.layer === layerIndex);
        
        console.log(`Found ${layerNeurons.length} neurons in layer ${layerIndex} to update`);
        
        // Update each neuron's weights and bias
        layerNeurons.forEach((neuron, neuronIndexInLayer) => {
          if (neuronIndexInLayer < weightMatrix.length && 
              neuronIndexInLayer < biasArray.length) {
            
            // Check if weights are changing (for debugging)
            const oldBias = neuron.bias;
            const oldWeight = neuron.weights.length > 0 ? neuron.weights[0] : null;
            
            // Update bias
            neuron.bias = biasArray[neuronIndexInLayer];
            
            // Update weights - these are connections from previous layer
            neuron.weights = weightMatrix[neuronIndexInLayer];
            
            // Log weight changes for the first few neurons in each layer
            if (neuronIndexInLayer < 2) {
              const newWeight = neuron.weights.length > 0 ? neuron.weights[0] : null;
              const biasChanged = Math.abs(oldBias - neuron.bias) > 0.00001;
              const weightChanged = oldWeight !== null && newWeight !== null && 
                                    Math.abs(oldWeight - newWeight) > 0.00001;
              
              console.log(`Neuron ${neuron.id} in layer ${layerIndex}:`);
              console.log(`  Bias: ${oldBias.toFixed(6)} → ${neuron.bias.toFixed(6)} (changed: ${biasChanged})`);
              console.log(`  First weight: ${oldWeight?.toFixed(6) || 'none'} → ${newWeight?.toFixed(6) || 'none'} (changed: ${weightChanged})`);
              
              if (biasChanged || weightChanged) weightsChanged = true;
            }
          } else {
            console.warn(`Neuron ${neuron.id} index out of bounds: ${neuronIndexInLayer} vs ${weightMatrix.length}x${biasArray.length}`);
          }
        });
      } else {
        console.warn(`Layer ${layerIndex} has no weights or incomplete weights`);
      }
    }
    
    console.log(`Weights changed in this update: ${weightsChanged ? 'YES' : 'NO'}`);
    
    // Update the neurons in the store
    set({ neurons: updatedNeurons });
    
    // Define the interval for recording history (every 5 epochs)
    const historyInterval = 5;
    // Determine if we should record history now:
    // 1. Record first epoch (0)
    // 2. Record at each interval (every 5 epochs)
    // 3. Record the last frame of training
    const shouldRecordHistory = 
      state.curr_epoch === 0 || 
      state.curr_epoch % historyInterval === 0 || 
      (state.is_training === false && state.curr_phase === "trained");
    
    // Now update the visual neurons to reflect the changes
    const updatedVisualNeurons = [...state.visualNeurons].map(visualNeuron => {
      // Get the neuron ID parts to find the corresponding model neuron
      const [type, layerStr, indexStr] = visualNeuron.id.split('-');
      const layer = parseInt(layerStr);
      
      // Skip input layer for weight updates (they don't have input weights)
      if (type === 'input') {
        return visualNeuron;
      }
      
      // For hidden and output neurons, match with the correct model neuron
      // Convert from visual neuron ID format to model neuron ID format:
      // hidden-1-0 or output-2-0 → neuron-1-0 or neuron-2-0
      const modelNeuronId = `neuron-${layer}-${indexStr}`;
      const modelNeuron = updatedNeurons.find(n => n.id === modelNeuronId);
      
      if (modelNeuron) {
        // Calculate average weight if weights exist
        const avgWeight = modelNeuron.weights && modelNeuron.weights.length > 0 ? 
          modelNeuron.weights.reduce((sum, w) => sum + w, 0) / modelNeuron.weights.length : 
          visualNeuron.weight; // Keep current weight if no weights found
        
        // Log for a few neurons to verify updates
        if ((type === 'hidden' && layerStr === '1' && indexStr === '0') || 
            (type === 'output' && indexStr === '0')) {
          console.log(`Updating ${type} neuron ${visualNeuron.id}:`);
          console.log(`  Old bias: ${visualNeuron.bias.toFixed(6)}, New bias: ${modelNeuron.bias.toFixed(6)}`);
          console.log(`  Old weight: ${visualNeuron.weight.toFixed(6)}, New weight: ${avgWeight.toFixed(6)}`);
        }
        
        // Update the visual neuron with model neuron data
        const updatedNeuron = {
          ...visualNeuron,
          bias: modelNeuron.bias,
          weight: avgWeight
        };
        
        // Only update history if this neuron's window is open or we should record history
        if (visualNeuron.isWindowOpen || shouldRecordHistory) {
          // Initialize history arrays if they don't exist
          const weightHistory = visualNeuron.weightHistory || [];
          const biasHistory = visualNeuron.biasHistory || [];
          const activationHistory = visualNeuron.activationHistory || [];
          
          // Add new history entries when:
          // 1. We're in training mode AND we're at a recording interval, OR
          // 2. This is the first entry (weightHistory is empty)
          if ((state.is_training && shouldRecordHistory) || weightHistory.length === 0) {
            updatedNeuron.weightHistory = [...weightHistory, avgWeight];
            updatedNeuron.biasHistory = [...biasHistory, modelNeuron.bias];
            updatedNeuron.activationHistory = [...activationHistory, visualNeuron.activation];
          } else {
            // Just maintain existing history arrays
            updatedNeuron.weightHistory = weightHistory;
            updatedNeuron.biasHistory = biasHistory;
            updatedNeuron.activationHistory = activationHistory;
          }
        }
        
        return updatedNeuron;
      }
      
      // If we couldn't find a model neuron, return the visual neuron unchanged
      console.warn(`Could not find model neuron ${modelNeuronId} for visual neuron ${visualNeuron.id}`);
      return visualNeuron;
    });
    
    // Update visual neurons
    set({ visualNeurons: updatedVisualNeurons });
    
    // Also update the connections to reflect the weight changes
    get().updateConnections();
  },
  // Add method to toggle window state for a neuron
  toggleNeuronWindow: (neuronId: string, isOpen: boolean) => {
    set(state => {
      const updatedNeurons = [...state.visualNeurons].map(neuron => {
        if (neuron.id === neuronId) {
          if (isOpen && !neuron.weightHistory) {
            // Initialize history arrays when window is opened
            return {
              ...neuron,
              isWindowOpen: isOpen,
              weightHistory: [neuron.weight],
              biasHistory: [neuron.bias],
              activationHistory: [neuron.activation]
            };
          } else if (!isOpen) {
            // Clear history when window is closed to save memory
            const { weightHistory, biasHistory, activationHistory, ...rest } = neuron;
            return {
              ...rest,
              isWindowOpen: false
            };
          }
          return { ...neuron, isWindowOpen: isOpen };
        }
        return neuron;
      });
      
      return { visualNeurons: updatedNeurons };
    });
  },
  initializeNetwork: () => {
    const state = get();
    if (!state.layers || state.layers.length === 0) return;
    
    // Calculate total number of layers (input + hidden + output)
    const totalLayers = state.layers.length + 2;
    const spacing = 2.5;
    
    // Create an array to hold all visual neuron objects
    const newNeurons: NeuronVisual[] = [];
    
    // First, generate neuron objects for input layer
    for (let i = 0; i < state.input_neurons; i++) {
      newNeurons.push({
        id: `input-0-${i}`,
        position: new Vector3(0, 0, 0), // Temporary position, will be updated later
        activation: 0,
        weight: 0,
        bias: 0,
        activationFunction: 'sigmoid',
        layer: 0,
        type: 'input', // Explicitly mark as input layer neuron
        weightHistory: [],
        biasHistory: [],
        activationHistory: []
      });
    }
    
    // Generate neuron objects for hidden layers
    let currentLayer = 1;
    state.layers.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.neurons; i++) {
        newNeurons.push({
          id: `neuron-${currentLayer}-${i}`,
          position: new Vector3(0, 0, 0), // Temporary position, will be updated later
          activation: 0,
          weight: 0,
          bias: 0,
          activationFunction: layer.name.includes('relu') ? 'relu' : layer.name.includes('tanh') ? 'tanh' : 'sigmoid',
          layer: currentLayer,
          type: 'hidden', // Explicitly mark as hidden layer neuron
          weightHistory: [],
          biasHistory: [],
          activationHistory: []
        });
      }
      currentLayer++;
    });
    
    // Generate neuron objects for output layer
    for (let i = 0; i < state.output_neurons; i++) {
      newNeurons.push({
        id: `output-${currentLayer}-${i}`,
        position: new Vector3(0, 0, 0), // Temporary position, will be updated later
        activation: 0,
        weight: 0,
        bias: 0,
        activationFunction: 'sigmoid',
        layer: currentLayer,
        type: 'output', // Explicitly mark as output layer neuron
        weightHistory: [],
        biasHistory: [],
        activationHistory: []
      });
    }
    
    // Now position all neurons
    let currentNeuronIndex = 0;
    
    // Helper function to position neurons in a layer
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
    const { visualNeurons, neurons, fallbackWeightsCache } = state;
    
    console.log(`Updating connections: ${neurons.length} model neurons, ${visualNeurons.length} visual neurons`);
    
    // For each layer except the last, connect to the next layer
    for (let layerIndex = 0; layerIndex < state.num_layers + 1; layerIndex++) {
      const thisLayerNeurons = visualNeurons.filter(n => n.layer === layerIndex);
      const nextLayerNeurons = visualNeurons.filter(n => n.layer === layerIndex + 1);
      
      console.log(`Layer ${layerIndex}: ${thisLayerNeurons.length} neurons → Layer ${layerIndex + 1}: ${nextLayerNeurons.length} neurons`);
      
      if (thisLayerNeurons.length === 0 || nextLayerNeurons.length === 0) {
        console.warn(`Missing neurons in layer ${layerIndex} or ${layerIndex + 1}`);
        continue;
      }
      
      // For each neuron in this layer, create connections to all neurons in the next layer
      thisLayerNeurons.forEach((startNeuron, startIndex) => {
        nextLayerNeurons.forEach((endNeuron, endIndex) => {
          // Get the neuron ID parts to find the corresponding model neuron
          const [endType, endLayerStr, endIndexStr] = endNeuron.id.split('-');
          const endLayer = parseInt(endLayerStr);
          
          // Find the model neuron that corresponds to this visual neuron
          const modelNeuron = neurons.find(n => 
            n.layer === endLayer && 
            n.id === `neuron-${endLayer}-${endIndexStr}`
          );
          
          // Create a unique key for this connection to use with the cache
          const connectionKey = `${startNeuron.id}-to-${endNeuron.id}`;
          
          let weight = 0;
          let connectionStrength = 0.5; // Default neutral strength
          
          if (modelNeuron && modelNeuron.weights && modelNeuron.weights.length > startIndex) {
            // Use the actual weight from the model
            weight = modelNeuron.weights[startIndex];
            
            // Convert to a visualization-friendly value (0-1 range)
            // Using sigmoid to normalize: 1 / (1 + e^-x)
            connectionStrength = 1 / (1 + Math.exp(-3 * weight)); // Multiply by 3 to increase contrast
            
            // Update the cache with the real weight
            fallbackWeightsCache[connectionKey] = weight;
            
            if (startIndex === 0 && endIndex === 0) {
              console.log(`Connection weight (from model): ${startNeuron.id} → ${endNeuron.id}, raw: ${weight.toFixed(6)}, visual: ${connectionStrength.toFixed(4)}`);
            }
          } else {
            // First, check if we already have a fallback weight for this connection
            if (fallbackWeightsCache[connectionKey] !== undefined) {
              // Use the cached weight
              weight = fallbackWeightsCache[connectionKey];
              
              if (startIndex === 0 && endIndex === 0) {
                console.log(`Connection weight (from cache): ${startNeuron.id} → ${endNeuron.id}, raw: ${weight.toFixed(6)}`);
              }
            } else {
              // Generate a new random weight and store it in the cache
              weight = Math.random() * 0.2 - 0.1; // Small random weight between -0.1 and 0.1
              fallbackWeightsCache[connectionKey] = weight;
              
              if (startIndex === 0 && endIndex === 0) {
                console.log(`Connection weight (new random): ${startNeuron.id} → ${endNeuron.id}, raw: ${weight.toFixed(6)}`);
                
                if (!modelNeuron) {
                  console.warn(`Could not find model neuron: neuron-${endLayer}-${endIndexStr}`);
                } else if (!modelNeuron.weights) {
                  console.warn(`Model neuron ${modelNeuron.id} has no weights array`);
                } else {
                  console.warn(`Model neuron ${modelNeuron.id} weights length (${modelNeuron.weights.length}) too short for index ${startIndex}`);
                }
              }
            }
            
            // Calculate connection strength from the weight (cached or new)
            connectionStrength = 1 / (1 + Math.exp(-3 * weight));
          }
          
          // Always create the connection, even with fallback values
          connections.push({
            id: connectionKey,
            startNeuronId: startNeuron.id,
            endNeuronId: endNeuron.id,
            strength: connectionStrength,
            rawWeight: weight
          });
        });
      });
    }
    
    // Log connection summary
    console.log(`Created ${connections.length} connections`);
    
    // Update the store with connections and the updated cache
    set({ 
      connections,
      fallbackWeightsCache
    });
  },
  rebuildModelFromLayers: () => {
    const state = get();
    
    // Clear the fallback weights cache when rebuilding
    set({ fallbackWeightsCache: {} });
    
    // Don't proceed if there's no selected dataset or training data
    if (!state.selectedDataset || !state.trainingData) {
      return;
    }
    
    // Dispose existing model if it exists
    if (state.model) {
      state.model.dispose();
    }
    
    // Create new model with current layer configuration (random initialization now)
    const newModel = createAndCompileModel(state.inputShape);
    
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
