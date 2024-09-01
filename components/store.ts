"use client";

import { create } from 'zustand';
import * as tf from "@tensorflow/tfjs";


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
}

type ModelStore = ModelInfo & ModelActions;


export const useModelStore = create<ModelStore>((set) => ({
    model: null,
    input_neurons: 2,
    output_neurons: 1,
    num_neurons: 1,
    num_layers: 0,
    layers: [],
    num_params: "N/A",
    curr_acc: "N/A",
    curr_loss: "N/A",
    curr_phase: "training",
    curr_epoch: 0,
    is_training: false,
    inputShape: [2], // TODO: Make this dynamic based on the input neurons
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
    }
}));