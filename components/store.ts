"use client";

import { create } from 'zustand';
import * as tf from "@tensorflow/tfjs";


interface ModelInfo {
    model: tf.LayersModel | null;
    num_neurons: number;
    num_layers: number;
    layers: { name: string; neurons: number }[];
    num_params: number | string;
    curr_acc: number | string;
    curr_loss: number | string;
    curr_phase: string;
    curr_epoch: number;
    is_training: boolean;
}

export const useModelStore = create<ModelInfo>((set) => ({
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
    setModel: (model: tf.LayersModel | null) => set({ model }),
    setNumNeurons: (num: number) => set({ num_neurons: num }),
    setNumLayers: (num: number) => set({ num_layers: num }),
    setLayers: (layers: { name: string; neurons: number }[]) => set({ layers }),
    setNumParams: (num: number) => set({ num_params: num }),
    setCurrAcc: (num: number) => set({ curr_acc: num }),
    setCurrLoss: (num: number) => set({ curr_loss: num }),
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