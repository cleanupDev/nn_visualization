"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  createAndCompileModel,
  inputTensor,
  targetTensor,
} from "@/model/tensorflowModel";
import { Neuron, useModelStore } from '../store';
import * as tf from "@tensorflow/tfjs";

const ControlPanel = () => {
  const {
    model,
    curr_epoch,
    is_training,
    setCurrAcc,
    setCurrLoss,
    setCurrPhase,
    setCurrEpoch,
    setModel,
    setIsTraining,
    setNeurons,
  } = useModelStore();

  const [isStylesLoaded, setIsStylesLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsStylesLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const createModel = () => {
    if (model) model.dispose();
    const newModel = createAndCompileModel();
    setModel(newModel);
    setCurrAcc(0);
    setCurrLoss(0);
    setCurrPhase("training");
    setCurrEpoch(0);
    updateWeightsAndBiases(newModel);
  };

  const addEpoch = async () => {
    if (!model) return;
    setIsTraining(true);

    try {
      const history = await model.fit(inputTensor, targetTensor, {
        epochs: 100,
        callbacks: {
          onEpochEnd: async (epoch: number, logs: any) => {
            console.log(
              `Epoch ${epoch + 1}: Loss = ${logs.loss}, Accuracy = ${logs.acc}`
            );
            // Update state with the latest accuracy and loss after each epoch
            setCurrAcc(logs.acc);
            setCurrLoss(logs.loss);
            setCurrEpoch(curr_epoch + epoch + 1);
            updateWeightsAndBiases(model);
          },
        },
      });
      const acc = history.history.acc ? history.history.acc[0] : null;
      const loss = history.history.loss ? history.history.loss[0] : null;

      //setCurrAcc(acc);
      //setCurrLoss(loss);
      //setCurrPhase("training");
      // setCurrEpoch(curr_epoch + 10);
    } catch (error) {
      console.error("Training failed:", error);
    } finally {
      setIsTraining(false);
    }
  };

  const updateWeightsAndBiases = (model: tf.LayersModel) => {
    model.layers.forEach((layer) => {
      const weights = layer.getWeights()[0];
      const biases = layer.getWeights()[1];
      if (weights && biases) {
        setNeurons((prevNeurons) => {
          return prevNeurons.map((neuron, neuronIndex) => {
            const weightData = weights.arraySync() as number[][];
            const biasData = biases.arraySync() as number[];
            return {
              ...neuron,
              weights: weightData[neuronIndex] || neuron.weights,
              bias: biasData[neuronIndex] || neuron.bias,
            };
          });
        });
      }
    });
  };

  const manualForwardPass = async () => {
    if (!model) return;
  };

  const addStep = async () => {};

  return (
    <div className="fixed top-4 left-0 w-full px-4 sm:left-1/5 sm:w-3/5 md:w-2/5 lg:left-1/5 lg:w-1/5 z-50">
      <div className="bg-[#28242c] rounded-lg shadow-lg p-2">
        <div className={`flex flex-wrap sm:flex-nowrap gap-2 ${isStylesLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <Button 
            variant={model ? "outline" : "destructive"} 
            onClick={createModel} 
            className="flex-grow basis-[calc(50%-0.25rem)] sm:basis-0 text-xs sm:text-sm"
          >
            Init
          </Button>
          <Button
            variant="outline"
            disabled={!model || is_training}
            onClick={addEpoch}
            className="flex-grow basis-[calc(50%-0.25rem)] sm:basis-0 text-xs sm:text-sm"
          >
            +100
          </Button>
          <Button 
            variant="outline" 
            disabled={!model || is_training} 
            className="flex-grow basis-[calc(50%-0.25rem)] sm:basis-0 text-xs sm:text-sm"
          >
            Step
          </Button>
          <Button 
            variant="outline" 
            disabled={!model || is_training} 
            className="flex-grow basis-[calc(50%-0.25rem)] sm:basis-0 text-xs sm:text-sm"
          >
            Phase
          </Button>
        </div>
      </div>
      <ControlPanelStyles />
    </div>
  );
};

const controlPanelStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #4a4550 #3a3540;
    transition: scrollbar-color 0.3s ease;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #3a3540;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4a4550;
    border-radius: 4px;
    transition: background 0.3s ease;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #5a5560;
  }
`;

function ControlPanelStyles() {
  return <style jsx global>{controlPanelStyles}</style>;
}

export default ControlPanel;
