"use client";

import { create } from 'zustand';
import * as tf from "@tensorflow/tfjs";
import Neuron from './visualization/neuron';


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
    setNeurons: (neurons: Neuron[]) => void;
    addNeuron: (layer: number) => void;
    removeNeuron: (neuronId: string) => void;
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
}

interface Neuron {
    id: string;
    position: { x: number; y: number; z: number };
    layer: number;
    bias: number;
    weights: number[];
    activation: string;
}

type ModelStore = ModelInfo & ModelActions;


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
    inputShape: [2], // TODO: Make this dynamic based on the input neurons
    neurons: [],
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
    setNeurons: (neurons: Neuron[]) => set({ neurons }),
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
}));