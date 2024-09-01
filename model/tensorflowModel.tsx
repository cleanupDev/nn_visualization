"use client";

// Assuming this is in a separate file like utils/modelCreation.ts
import * as tf from "@tensorflow/tfjs";
import { useModelStore } from "@/components/store";

// TODO: Make this dynamic based on the input neurons
export const inputData = tf.tensor([
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
]);

export const inputTensor = inputData.reshape([4, 2]);

export const targetData = tf.tensor([[0], [1], [1], [0]]);
export const targetTensor = targetData.reshape([4, 1]);

export const createAndCompileModel = () => {
  const { input_neurons, output_neurons, layers, inputShape, setNumParams, setNeurons } =
    useModelStore.getState(); // Using getState to access the store outside of React components

  const model = tf.sequential();

  const neurons = [];

  model.add(
    tf.layers.inputLayer({
      inputShape: inputShape,
    })
  );

  // push each input neuron to the neurons array
  for (let i = 0; i < input_neurons; i++) {
    neurons.push({
      id: i.toString(),
      position: { x: 0, y: 0, z: 0 },
      layer: 0,
      bias: 0,
      weights: [],
      activation: "None",
    });
  }

  layers.forEach((layer) => {
    model.add(
      tf.layers.dense({
        units: layer.neurons,
        activation: "relu",
      })
    );
  });

  // push each hidden neuron to the neurons array
  for (let i = 0; i < layers.length; i++) {
    for (let j = 0; j < layers[i].neurons; j++) {
      neurons.push({
        id: `${i}-${j}`,
        position: { x: 0, y: 0, z: 0 },
        layer: i + 1,
        bias: 0,
        weights: [],
        activation: "relu",
      });
    }
  }

  model.add(
    tf.layers.dense({
      units: output_neurons,
      activation: "sigmoid",
    })
  );

  // push each output neuron to the neurons array
  for (let i = 0; i < output_neurons; i++) {
    neurons.push({
      id: `${layers.length}-${i}`,
      position: { x: 0, y: 0, z: 0 },
      layer: layers.length + 1,
      bias: 0,
      weights: [],
      activation: "sigmoid",
    });
  }
  
  model.compile({
    optimizer: "rmsprop",
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });

  setNeurons(neurons);

  const numParams = model.countParams();
  setNumParams(numParams); // Update the number of parameters in the store

  

  return model;
};
