"use client";

import * as tf from "@tensorflow/tfjs";
import { Neuron, useModelStore } from "@/components/store";

// Initialize TensorFlow.js with WebGL when possible
async function initTensorflowBackend() {
  // Try to use WebGL first
  try {
    await tf.setBackend('webgl');
    const backend = tf.getBackend();
    console.log(`Using TensorFlow.js backend: ${backend}`);
    
    // Log GPU details if using WebGL
    if (backend === 'webgl') {
      const webglBackend = tf.backend() as any;
      if (webglBackend && webglBackend.gpgpu) {
        console.log('WebGL is active - GPU acceleration available');
        // Log GPU info if available
        try {
          const gl = webglBackend.gpgpu.gl;
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            console.log(`GPU Vendor: ${vendor}`);
            console.log(`GPU Renderer: ${renderer}`);
          }
        } catch (e) {
          console.log('Could not get detailed GPU info');
        }
      }
    } else {
      console.warn('WebGL acceleration not available, using CPU instead');
    }
  } catch (e) {
    console.warn('Failed to initialize WebGL backend:', e);
    await tf.setBackend('cpu');
    console.log('Fallback to CPU backend');
  }
}

// Initialize backend when this module loads
initTensorflowBackend();

// Remove initializer type export
// export type InitializerType = 'glorot_uniform' | 'he_normal' | 'random_normal' | 'zeros';

export function createAndCompileModel(
  inputShape: number[] = [2]
) {
  const {
    input_neurons,
    output_neurons,
    layers,
    setNumParams,
    setNeurons,
    trainingData, 
    selectedDataset,
  } = useModelStore.getState();

  console.log("Creating new model with optimized initialization");
  
  const model = tf.sequential();

  const neurons: Neuron[] = [];

  // Use more appropriate initializers based on activation function
  // He initialization for ReLU, Xavier/Glorot for sigmoid
  const hiddenLayerInitializer = tf.initializers.heNormal({ seed: 42 });
  const outputLayerInitializer = tf.initializers.glorotNormal({ seed: 42 });
  const biasInitializer = tf.initializers.zeros();

  model.add(
    tf.layers.inputLayer({
      inputShape: inputShape,
    })
  );

  // push each input neuron to the neurons array
  for (let i = 0; i < input_neurons; i++) {
    neurons.push({
      id: `neuron-0-${i}`,
      position: { x: 0, y: 0, z: 0 },
      layer: 0,
      bias: 0, // Input neurons don't need random bias
      weights: [], // Input neurons don't have input weights
      activation: "None",
    });
  }

  // Add hidden layers with appropriate initialization
  layers.forEach((layer, layerIdx) => {
    const layerIndex = layerIdx + 1;
    model.add(
      tf.layers.dense({
        units: layer.neurons,
        activation: "relu",
        kernelInitializer: hiddenLayerInitializer,
        biasInitializer: biasInitializer,
      })
    );
  });

  // Add output layer with appropriate initialization
  model.add(
    tf.layers.dense({
      units: output_neurons,
      activation: selectedDataset === 'sine' 
                 ? "tanh" 
                 : selectedDataset === 'mnist'
                   ? "softmax"
                   : "sigmoid",
      kernelInitializer: outputLayerInitializer,
      biasInitializer: biasInitializer,
    })
  );

  // Choose optimal optimizer based on dataset
  let optimizer;
  let optimizerDescription = "N/A";
  let lossFunction = "N/A";
  let learningRate = 0.01;
  let momentumValue = null;
  
  if (selectedDataset === 'mnist') {
    // Adam optimizer works better for complex datasets
    learningRate = 0.001;
    optimizer = tf.train.adam(learningRate);
    lossFunction = 'categoricalCrossentropy';
    optimizerDescription = `Adam`;
  } else if (selectedDataset === 'sine') {
    // RMSProp works well for regression problems
    learningRate = 0.01;
    optimizer = tf.train.rmsprop(learningRate);
    lossFunction = 'meanSquaredError';
    optimizerDescription = `RMSProp`;
  } else {
    // SGD with momentum for XOR
    learningRate = 0.1;
    momentumValue = 0.9;
    optimizer = tf.train.momentum(learningRate, momentumValue);
    lossFunction = 'meanSquaredError';
    optimizerDescription = `SGD+Momentum`;
  }

  // Update the store with optimizer information
  useModelStore.setState({ 
    currentOptimizer: optimizerDescription,
    currentLossFunction: lossFunction,
    learningRate: learningRate,
    momentumValue: momentumValue
  });
  
  // Compile the model with appropriate loss function and optimizer
  model.compile({
    optimizer: optimizer,
    loss: lossFunction,
    metrics: ["accuracy"],
  });

  console.log("Model created, extracting weights...");
  
  // Extract weights for visualization
  for (let layerIndex = 1; layerIndex < model.layers.length; layerIndex++) {
    const layer = model.layers[layerIndex];
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
      
      // Create neurons for this layer
      for (let i = 0; i < weightMatrix.length; i++) {
        const neuronId = `neuron-${layerIndex}-${i}`;
        // Update activation function based on the dataset and layer
        const activation = layerIndex === model.layers.length - 1 
          ? (selectedDataset === 'sine' 
             ? "tanh" 
             : selectedDataset === 'mnist'
               ? "softmax"
               : "sigmoid")
          : "relu";
        
        neurons.push({
          id: neuronId,
          position: { x: 0, y: 0, z: 0 },
          layer: layerIndex,
          bias: biasArray[i],
          weights: weightMatrix[i],
          activation,
        });
      }
    } else {
      console.warn(`Layer ${layerIndex} has no weights or incomplete weights`);
    }
  }

  // Update neurons in the store
  setNeurons(() => neurons);

  const numParams = model.countParams();
  setNumParams(numParams);

  return model;
}
