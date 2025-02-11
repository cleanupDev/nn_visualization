"use client";

import * as tf from "@tensorflow/tfjs";
import { Neuron, useModelStore } from "@/components/store";

export const createAndCompileModel = () => {
  const {
    input_neurons,
    output_neurons,
    layers,
    inputShape,
    setNumParams,
    setNeurons,
    trainingData, // Get trainingData from the store
  } = useModelStore.getState();

  const model = tf.sequential();

  const neurons: Neuron[] = [];

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
    loss: "binaryCrossentropy", // Adjust loss based on dataset
    metrics: ["accuracy"], // Adjust metrics based on dataset
  });

  setNeurons((prevNeurons) => neurons);

  const numParams = model.countParams();
  setNumParams(numParams);

  return model;
};
