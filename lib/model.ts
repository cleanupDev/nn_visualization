"use client";

import * as tf from "@tensorflow/tfjs";
import { Neuron, useModelStore } from "@/components/store";

// Define initialization types for our UI
export type InitializerType = 'glorot_uniform' | 'he_normal' | 'random_normal' | 'zeros';

export function createAndCompileModel(
  inputShape: number[] = [2], 
  initializer: InitializerType = 'glorot_uniform'
) {
  const {
    input_neurons,
    output_neurons,
    layers,
    setNumParams,
    setNeurons,
    trainingData, // Get trainingData from the store
  } = useModelStore.getState();

  const model = tf.sequential();

  const neurons: Neuron[] = [];

  // Select the appropriate initializer
  let kernelInitializer;
  switch (initializer) {
    case 'he_normal':
      kernelInitializer = 'heNormal';
      break;
    case 'random_normal':
      kernelInitializer = tf.initializers.randomNormal({ mean: 0, stddev: 0.1 });
      break;
    case 'zeros':
      kernelInitializer = 'zeros';
      break;
    case 'glorot_uniform':
    default:
      kernelInitializer = 'glorotUniform';
      break;
  }

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
      bias: 0,
      weights: [],
      activation: "None",
    });
  }

  // Add hidden layers with the selected initializer
  layers.forEach((layer, layerIdx) => {
    const layerIndex = layerIdx + 1;
    model.add(
      tf.layers.dense({
        units: layer.neurons,
        activation: "relu",
        kernelInitializer: kernelInitializer,
        biasInitializer: 'zeros',
      })
    );
  });

  // Add output layer with the same initializer
  model.add(
    tf.layers.dense({
      units: output_neurons,
      activation: "sigmoid",
      kernelInitializer: kernelInitializer,
      biasInitializer: 'zeros',
    })
  );

  // push each output neuron to the neurons array
  for (let i = 0; i < output_neurons; i++) {
    neurons.push({
      id: `neuron-${layers.length + 1}-${i}`,
      position: { x: 0, y: 0, z: 0 },
      layer: layers.length + 1,
      bias: 0,
      weights: [],
      activation: "sigmoid",
    });
  }

  model.compile({
    optimizer: "sgd",
    loss: "meanSquaredError",
    metrics: ["accuracy"],
  });

  setNeurons((prevNeurons) => neurons);

  const numParams = model.countParams();
  setNumParams(numParams);

  return model;
}
