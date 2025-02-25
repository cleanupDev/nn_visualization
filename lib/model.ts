"use client";

import * as tf from "@tensorflow/tfjs";
import { Neuron, useModelStore } from "@/components/store";

// Remove initializer type export
// export type InitializerType = 'glorot_uniform' | 'he_normal' | 'random_normal' | 'zeros';

export function createAndCompileModel(
  inputShape: number[] = [2]
  // Remove initializer parameter
) {
  const {
    input_neurons,
    output_neurons,
    layers,
    setNumParams,
    setNeurons,
    trainingData, // Get trainingData from the store
  } = useModelStore.getState();

  console.log("Creating new model with random initialization");
  
  const model = tf.sequential();

  const neurons: Neuron[] = [];

  // Always use random normal initialization with higher variance for better training
  const kernelInitializer = tf.initializers.randomNormal({ mean: 0, stddev: 0.1 });
  // Add random initialization for biases too
  const biasInitializer = tf.initializers.randomNormal({ mean: 0, stddev: 0.1 });

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
      bias: Math.random() * 0.2 - 0.1, // Random bias between -0.1 and 0.1
      weights: [], // Input neurons don't have input weights
      activation: "None",
    });
  }

  // Add hidden layers with random initialization
  layers.forEach((layer, layerIdx) => {
    const layerIndex = layerIdx + 1;
    model.add(
      tf.layers.dense({
        units: layer.neurons,
        activation: "relu",
        kernelInitializer: kernelInitializer,
        biasInitializer: biasInitializer,
      })
    );
  });

  // Add output layer with random initialization
  model.add(
    tf.layers.dense({
      units: output_neurons,
      activation: "sigmoid",
      kernelInitializer: kernelInitializer,
      biasInitializer: biasInitializer,
    })
  );

  // Compile the model before extracting weights
  model.compile({
    optimizer: "sgd",
    loss: "meanSquaredError",
    metrics: ["accuracy"],
  });

  console.log("Model created, extracting weights...");
  
  // Extract weights from the model to initialize neurons properly
  // Skip input layer (index 0) as it doesn't have incoming weights
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
        
        // Log some neurons for debugging
        if (i === 0) {
          console.log(`Created ${layerIndex === model.layers.length - 1 ? "output" : "hidden"} neuron ${neuronId} with:`);
          console.log(`  Bias: ${biasArray[i].toFixed(6)}`);
          console.log(`  First few weights: ${weightMatrix[i].slice(0, 3).map(w => w.toFixed(6)).join(', ')} (total: ${weightMatrix[i].length})`);
        }
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
