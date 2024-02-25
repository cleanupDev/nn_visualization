"use client";

import { create } from 'zustand';

interface ModelInfo {
    num_neurons: number;
    num_layers: number;
    layers: { name: string; neurons: number }[];
    num_params: number;
    curr_acc: number;
    curr_loss: number;
    curr_phase: string;
    curr_epoch: number;
}

export const useModelStore = create<ModelInfo>((set) => ({
    input_neurons: 2,
    output_neurons: 1,
    num_neurons: 1,
    num_layers: 0,
    layers: [],
    num_params: 0,
    curr_acc: 0,
    curr_loss: 0,
    curr_phase: "training",
    curr_epoch: 0,
    setNumNeurons: (num: number) => set({ num_neurons: num }),
    setNumLayers: (num: number) => set({ num_layers: num }),
    setLayers: (layers: { name: string; neurons: number }[]) => set({ layers }),
    setNumParams: (num: number) => set({ num_params: num }),
    setCurrAcc: (num: number) => set({ curr_acc: num }),
    setCurrLoss: (num: number) => set({ curr_loss: num }),
    setCurrPhase: (phase: string) => set({ curr_phase: phase }),
    setCurrEpoch: (num: number) => set({ curr_epoch: num }),
    updateNumParams: () => {
        set((state) => {
            let totalParams = 0;
            for (let layer of state.layers) {
                totalParams += layer.neurons;
            }
            return { num_params: totalParams };
        });
    },
}));