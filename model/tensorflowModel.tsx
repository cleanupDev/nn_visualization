"use client";

// Assuming this is in a separate file like utils/modelCreation.ts
import * as tf from "@tensorflow/tfjs";
import { useModelStore } from "@/components/store";

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
  const { input_neurons, output_neurons, layers, setNumParams } =
    useModelStore.getState(); // Using getState to access the store outside of React components

  const model = tf.sequential();

  model.add(
    tf.layers.inputLayer({
      inputShape: [2],
    })
  );

  layers.forEach((layer) => {
    model.add(
      tf.layers.dense({
        units: layer.neurons,
        activation: "relu",
      })
    );
  });

  model.add(
    tf.layers.dense({
      units: output_neurons,
      activation: "sigmoid",
    })
  );

  model.compile({
    optimizer: "rmsprop",
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });

  const numParams = model.countParams();
  setNumParams(numParams); // Update the number of parameters in the store

  return model;
};
