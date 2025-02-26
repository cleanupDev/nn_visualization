"use client";

import * as tf from "@tensorflow/tfjs";
import { Neuron, useModelStore } from "@/components/store";

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
      activation: "sigmoid",
      kernelInitializer: outputLayerInitializer,
      biasInitializer: biasInitializer,
    })
  );

  // Choose optimal optimizer based on dataset
  let optimizer;
  if (selectedDataset === 'mnist') {
    // Adam optimizer works better for complex datasets
    optimizer = tf.train.adam(0.001);
  } else if (selectedDataset === 'sine') {
    // RMSProp works well for regression problems
    optimizer = tf.train.rmsprop(0.01);
  } else {
    // SGD with momentum for XOR
    optimizer = tf.train.momentum(0.1, 0.9);
  }

  // Compile the model with appropriate loss function and optimizer
  model.compile({
    optimizer: optimizer,
    loss: selectedDataset === 'mnist' ? 'categoricalCrossentropy' : 'meanSquaredError',
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
        const activation = layerIndex === model.layers.length - 1 ? "sigmoid" : "relu";
        
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
