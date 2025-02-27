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
  setShouldPause: (shouldPause: boolean) => void;
  setAnimationSpeed: (speed: number) => void;
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
  should_pause: boolean; // New state to track if training should be paused
  animationSpeed: number; // Animation speed Epochs
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
  activationFunction: 'sigmoid' | 'relu' | 'tanh' | 'softmax';
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
  isLoading: boolean;
  // Add MNIST specific functions
  mnistData: MnistData | null;
  getRandomMnistTestImage: () => { image: number[], label: number } | null;
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
  should_pause: false, // Initialize pause state as false
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
  isLoading: false,
  // Initialize MNIST data as null
  mnistData: null,
  animationSpeed: 1,

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
  setShouldPause: (shouldPause: boolean) => set({ should_pause: shouldPause }),
  setAnimationSpeed: (speed: number) => set({ animationSpeed: speed }),
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
          mnistData: null, // Reset MNIST data
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
          mnistData: null, // Reset MNIST data
        });
        break;

      case 'mnist':
        try {
          // Show loading state
          set({ isLoading: true });
          
          const mnist = new MnistData();
          await mnist.load();

          // Use a smaller subset of MNIST for better performance
          // Reducing from 5000 to 1000 samples for visualization - still trains well but much faster
          // This significantly reduces the neural network size and connection count
          const batchSize = 1000; 
          const { xs: mnistInputs, labels: mnistLabels } = mnist.nextTrainBatch(batchSize);
          
          // Enable memory optimization for WebGL
          if (tf.getBackend() === 'webgl') {
            // These settings help reduce GPU memory fragmentation
            (tf.env() as any).set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
            (tf.env() as any).set('WEBGL_FLUSH_THRESHOLD', 1);
            console.log('Enabled WebGL memory optimizations for MNIST');
          }

          set({
            trainingData: { xs: mnistInputs, ys: mnistLabels },
            selectedDataset: 'mnist',
            inputShape: [784], // Update input shape for MNIST
            isLoading: false,
            mnistData: mnist // Store the mnist data for later random image selection
          });
          
          // Run garbage collection to free memory
          setTimeout(() => {
            tf.tidy(() => {});
            console.log('Memory cleanup after MNIST loading. Current tensors:', tf.memory().numTensors);
          }, 1000);
        } catch (error) {
          console.error('Error loading MNIST:', error);
          set({ isLoading: false });
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
    
    // Skip updates if training is complete (not just paused)
    // This fixes the lag after training is finished
    if (state.curr_phase === "trained") {
      return;
    }
    
    // Clone the neurons array to avoid mutation
    const updatedNeurons = [...state.neurons];
    
    // Get the layers 
    const modelLayers = model.layers;
    
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
        
        // Find neurons in this layer
        const layerNeurons = updatedNeurons.filter(n => n.layer === layerIndex);
        
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
            
            // Track if weights changed
            const newWeight = neuron.weights.length > 0 ? neuron.weights[0] : null;
            const biasChanged = Math.abs(oldBias - neuron.bias) > 0.00001;
            const weightChanged = oldWeight !== null && newWeight !== null && 
                                  Math.abs(oldWeight - newWeight) > 0.00001;
            
            if (biasChanged || weightChanged) weightsChanged = true;
          }
        });
      }
    }
    
    // Update the neurons in the store
    set({ neurons: updatedNeurons });
    
    // Get current animation speed (FPS) from the state
    const animationSpeed = state.animationSpeed || 1;
    
    // Define the interval for recording history based on the slider value:
    // Use animationSpeed directly to determine after how many epochs we record history
    const historyInterval = Math.max(1, Math.floor(animationSpeed / 2));
    
    // Determine if we should record history now:
    // 1. Record first epoch (0)
    // 2. Record at each interval (based on animationSpeed)
    // 3. Record the last frame of training
    const shouldRecordHistory = 
      state.curr_epoch === 0 || 
      state.curr_epoch % historyInterval === 0 || 
      (state.is_training === false && state.curr_phase === "training"); // Only when paused, not when completed
      
    // Use the animationSpeed value directly as the connection update interval
    // This means if animationSpeed is 5, connections update every 5 epochs
    const connectionUpdateInterval = animationSpeed;
    
    // Only update connections at specific intervals to improve performance:
    // 1. First epoch (0)
    // 2. At connection update interval (directly from animationSpeed)
    // 3. When paused (but not when training is complete)
    const shouldUpdateConnections = 
      state.curr_epoch === 0 || 
      state.curr_epoch % connectionUpdateInterval === 0 || 
      (state.is_training === false && state.curr_phase === "training");
    
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
        
        // Update the visual neuron with model neuron data
        const updatedNeuron = {
          ...visualNeuron,
          bias: modelNeuron.bias,
          weight: avgWeight
        };
        
        // Only update history if this neuron's window is open
        // This is a key optimization: we only track history for neurons being viewed
        if (visualNeuron.isWindowOpen) {
          // Initialize history arrays if they don't exist
          const weightHistory = visualNeuron.weightHistory || [];
          const biasHistory = visualNeuron.biasHistory || [];
          const activationHistory = visualNeuron.activationHistory || [];
          
          // Limit history size to prevent memory bloat
          const MAX_HISTORY_LENGTH = 50;
          
          // Add new history entries when:
          // 1. We're in training mode AND we're at a recording interval, OR
          // 2. This is the first entry (weightHistory is empty)
          if ((state.is_training && shouldRecordHistory) || weightHistory.length === 0) {
            // Add new history value while respecting the maximum length
            updatedNeuron.weightHistory = [...weightHistory, avgWeight].slice(-MAX_HISTORY_LENGTH);
            updatedNeuron.biasHistory = [...biasHistory, modelNeuron.bias].slice(-MAX_HISTORY_LENGTH);
            updatedNeuron.activationHistory = [...activationHistory, visualNeuron.activation].slice(-MAX_HISTORY_LENGTH);
          } else {
            // Just maintain existing history arrays
            updatedNeuron.weightHistory = weightHistory;
            updatedNeuron.biasHistory = biasHistory;
            updatedNeuron.activationHistory = activationHistory;
          }
        } else {
          // For closed windows, don't maintain history arrays at all
          // This saves memory and processing time
          const { weightHistory, biasHistory, activationHistory, ...rest } = updatedNeuron;
          return rest;
        }
        
        return updatedNeuron;
      }
      
      // If we couldn't find a model neuron, return the visual neuron unchanged
      return visualNeuron;
    });
    
    // Update visual neurons
    set({ visualNeurons: updatedVisualNeurons });
    
    // Only update connections at specific intervals
    // This is a major optimization to reduce the frequency of expensive connection updates
    if (shouldUpdateConnections) {
      get().updateConnections();
    }
  },
  // Add method to toggle window state for a neuron
  toggleNeuronWindow: (neuronId: string, isOpen: boolean) => {
    set(state => {
      const updatedNeurons = [...state.visualNeurons].map(neuron => {
        if (neuron.id === neuronId) {
          if (isOpen && !neuron.isWindowOpen) {
            // Only initialize history arrays when window is first opened
            // This prevents duplicate initialization
            return {
              ...neuron,
              isWindowOpen: true,
              // Initialize with just the current value to start
              weightHistory: [neuron.weight],
              biasHistory: [neuron.bias],
              activationHistory: [neuron.activation]
            };
          } else if (!isOpen) {
            // Aggressively clean up history when window is closed to save memory
            // This is the key optimization - completely remove history arrays
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
        activationFunction: 'relu', // Input neurons pass through directly, no activation function
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
          activationFunction: 'relu', // Always use ReLU for hidden layers
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
        activationFunction: state.selectedDataset === 'sine' 
                          ? 'tanh' 
                          : state.selectedDataset === 'mnist'
                            ? 'softmax'
                            : 'sigmoid',
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
    const { visualNeurons, neurons, fallbackWeightsCache, connections: existingConnections } = state;
    
    // Skip update if there are no neurons to visualize
    if (visualNeurons.length === 0) {
      return;
    }
    
    // Create a map of existing connections for quick lookups
    const existingConnectionsMap = new Map();
    existingConnections.forEach(conn => {
      existingConnectionsMap.set(conn.id, conn);
    });
    
    // Only log when debugging is needed
    // console.log(`Updating connections: ${neurons.length} model neurons, ${visualNeurons.length} visual neurons`);
    
    const newConnections: Connection[] = [];
    let connectionsChanged = false;
    
    // Create a mapping of neuron IDs to model neurons for faster lookups
    const neuronModelMap = new Map();
    neurons.forEach(neuron => {
      neuronModelMap.set(neuron.id, neuron);
    });
    
    // For each layer except the last, connect to the next layer
    for (let layerIndex = 0; layerIndex < state.num_layers + 1; layerIndex++) {
      // Skip layers with no neurons
      if (layerIndex >= state.num_layers + 1) continue;
      
      // Pre-filter neurons by layer to avoid repeated filtering operations
      const thisLayerNeurons = visualNeurons.filter(n => n.layer === layerIndex);
      const nextLayerNeurons = visualNeurons.filter(n => n.layer === layerIndex + 1);
      
      // Skip if either layer has no neurons
      if (thisLayerNeurons.length === 0 || nextLayerNeurons.length === 0) continue;
      
      // Process connections in batches to improve performance
      for (let startIndex = 0; startIndex < thisLayerNeurons.length; startIndex++) {
        const startNeuron = thisLayerNeurons[startIndex];
        
        for (let endIndex = 0; endIndex < nextLayerNeurons.length; endIndex++) {
          const endNeuron = nextLayerNeurons[endIndex];
          
          // Get the neuron ID parts to find the corresponding model neuron
          const [endType, endLayerStr, endIndexStr] = endNeuron.id.split('-');
          const endLayer = parseInt(endLayerStr);
          
          // Create a unique key for this connection to use with the cache
          const connectionKey = `${startNeuron.id}-to-${endNeuron.id}`;
          
          // Check if we already have this connection in our existing set
          const existingConnection = existingConnectionsMap.get(connectionKey);
          
          // Find model neuron using the map instead of .find() for better performance
          const modelNeuronId = `neuron-${endLayer}-${endIndexStr}`;
          const modelNeuron = neuronModelMap.get(modelNeuronId);
          
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
            
            // Check if this connection has actually changed
            if (existingConnection && 
                Math.abs(existingConnection.strength - connectionStrength) < 0.001 &&
                Math.abs(existingConnection.rawWeight - weight) < 0.001) {
              // Connection hasn't meaningfully changed, reuse it
              newConnections.push(existingConnection);
              continue; // Skip to next connection
            }
            
            // Only set connectionsChanged flag if this is a new connection or significantly changed
            connectionsChanged = true;
          } else {
            // First, check if we already have a fallback weight for this connection
            if (fallbackWeightsCache[connectionKey] !== undefined) {
              // Use the cached weight
              weight = fallbackWeightsCache[connectionKey];
            } else {
              // Otherwise generate a random weight for visualization
              weight = Math.random() * 0.2 - 0.1; // Small random number between -0.1 and 0.1
              fallbackWeightsCache[connectionKey] = weight;
            }
            
            // Calculate connection strength using the same formula
            connectionStrength = 1 / (1 + Math.exp(-3 * weight));
          }
          
          // Add the new or updated connection
          newConnections.push({
            id: connectionKey,
            startNeuronId: startNeuron.id,
            endNeuronId: endNeuron.id,
            strength: connectionStrength,
            rawWeight: weight
          });
        }
      }
    }
    
    // Only update state if connections actually changed
    if (connectionsChanged || newConnections.length !== existingConnections.length) {
      set({ connections: newConnections });
    }
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
  // Add function to get a random MNIST test image 
  getRandomMnistTestImage: () => {
    const { mnistData } = get();
    if (!mnistData) return null;
    
    // Get a single random image from the test dataset
    const { xs, labels } = mnistData.nextTestBatch(1);
    
    // Convert to array
    const imageData = xs.dataSync();
    
    // Get the label (one-hot encoded)
    const labelData = labels.dataSync();
    
    // Convert one-hot encoding to single digit
    const label = labelData.indexOf(1);
    
    // Dispose tensors to prevent memory leaks
    xs.dispose();
    labels.dispose();
    
    return { 
      image: Array.from(imageData), 
      label 
    };
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
