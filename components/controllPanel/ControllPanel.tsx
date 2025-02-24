"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useModelStore } from '@/components/store';
import * as tf from "@tensorflow/tfjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "../ui/slider";

const ControlPanel = () => {
  const {
    model,
    curr_epoch,
    curr_acc,
    curr_loss,
    curr_phase,
    is_training,
    setCurrAcc,
    setCurrLoss,
    setCurrPhase,
    setCurrEpoch,
    setIsTraining,
    trainingData,
    selectedDataset,
    createModelAndLoadData,
    updateWeightsAndBiases,
    rebuildModelFromLayers
  } = useModelStore();

  const [isStylesLoaded, setIsStylesLoaded] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(30); // Default animation speed
  const [animationInterval, setAnimationInterval] = useState<NodeJS.Timeout | null>(null);
  const [numEpochs, setNumEpochs] = useState(50); // Default number of epochs
  // Track total epochs across multiple training sessions
  const [totalEpochs, setTotalEpochs] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsStylesLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Load XOR dataset by default
  useEffect(() => {
    if (!selectedDataset) {
      createModelAndLoadData('xor');
    }
  }, [selectedDataset, createModelAndLoadData]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [animationInterval]);

  // Update total epochs tracker when current epoch changes
  useEffect(() => {
    if (curr_epoch > 0) {
      setTotalEpochs(curr_epoch);
    }
  }, [curr_epoch]);

  // Reset total epochs when dataset changes
  useEffect(() => {
    setTotalEpochs(0);
  }, [selectedDataset]);

  const handleDatasetChange = (value: string) => {
    createModelAndLoadData(value as 'xor' | 'sine' | 'mnist');
  };

  const manualForwardPass = async () => {
    if (!model) return;
  };

  const startTraining = async (continueTraining: boolean = false) => {
    if (!model || !trainingData) return;
    setIsTraining(true);
    
    // Reset epoch counter only if not continuing from previous training
    if (!continueTraining) {
      setCurrEpoch(0);
      setTotalEpochs(0);
    }

    try {
      // Set up animation interval for smoother visual updates
      if (animationInterval) {
        clearInterval(animationInterval);
      }
      
      // Use higher animation speed for better visualization
      // This will update the visual weights more frequently than the actual training steps
      const intervalId = setInterval(() => {
        if (model) {
          updateWeightsAndBiases(model);
        }
      }, 1000 / animationSpeed); // Update visuals X times per second
      
      setAnimationInterval(intervalId);
      
      // Get start epoch based on continuation mode
      const startEpoch = continueTraining ? totalEpochs : 0;
      const epochsToTrain = numEpochs;
      
      console.log(`Training from epoch ${startEpoch} for ${epochsToTrain} epochs`);
    
      const history = await model.fit(trainingData.xs, trainingData.ys, {
        epochs: epochsToTrain,
        batchSize: 32,
        callbacks: {
          onEpochBegin: async (epoch: number) => {
            // Update epoch counter with offset for continuation
            const currentEpoch = startEpoch + epoch;
            setCurrEpoch(currentEpoch + 1); // +1 because epoch is 0-indexed in the callback
          },
          onEpochEnd: async (epoch: number, logs: any) => {
            const currentEpoch = startEpoch + epoch;
            console.log(
              `Epoch ${currentEpoch + 1}: Loss = ${logs.loss}, Accuracy = ${logs.acc || 'N/A'}`
            );
            // Update state with the latest accuracy and loss after each epoch
            setCurrAcc(logs.acc || 0);
            setCurrLoss(logs.loss || 0);
            // Epoch counter already updated in onEpochBegin
            // Weights will be updated by the animation interval
          },
        },
      });
      
      // Clean up the animation interval
      if (animationInterval) {
        clearInterval(animationInterval);
        setAnimationInterval(null);
      }
      
      setIsTraining(false);
      setCurrPhase("trained");
      
      // Update total epochs tracker
      setTotalEpochs(startEpoch + epochsToTrain);
      
      // Final update of weights and connections
      updateWeightsAndBiases(model);
      
    } catch (error) {
      // Clean up on error
      if (animationInterval) {
        clearInterval(animationInterval);
        setAnimationInterval(null);
      }
      
      console.error("Training error:", error);
      setIsTraining(false);
      setCurrPhase("error");
    }
  };

  return (
    <div className={`max-w-sm mx-auto p-5 rounded-lg ${isStylesLoaded ? 'bg-white/10 backdrop-blur-md' : ''}`}>
      <h2 className="text-lg font-semibold mb-4 text-white">Neural Network Control</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-200 mb-1">
          Select Dataset
        </label>
        <Select onValueChange={handleDatasetChange} defaultValue={selectedDataset || 'xor'}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select dataset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="xor">XOR Problem</SelectItem>
            <SelectItem value="sine">Sine Wave</SelectItem>
            <SelectItem value="mnist">MNIST Digits</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-200 mb-1">
          Number of Epochs
        </label>
        <div className="flex items-center gap-2">
          <Slider
            value={[numEpochs]}
            min={10}
            max={1000}
            step={10}
            onValueChange={(values: number[]) => setNumEpochs(values[0])}
            disabled={is_training}
            className="flex-grow"
          />
          <span className="ml-2 text-xs text-gray-300 min-w-[40px] text-right">{numEpochs}</span>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-200 mb-1">
          Animation Speed
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300">Slow</span>
          <Slider
            value={[animationSpeed]}
            min={1}
            max={60}
            step={1}
            onValueChange={(values: number[]) => setAnimationSpeed(values[0])}
            disabled={is_training}
            className="flex-grow"
          />
          <span className="text-xs text-gray-300">Fast</span>
          <span className="ml-2 text-xs text-gray-300">{animationSpeed} fps</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => startTraining(false)}
            disabled={is_training || !model}
            className="w-full"
            variant="default"
          >
            {is_training ? "Training..." : "New Training"}
          </Button>
          
          <Button
            onClick={() => startTraining(true)}
            disabled={is_training || !model || totalEpochs === 0}
            className="w-full"
            variant="secondary"
          >
            Continue Training
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm text-white">
          <div>Epochs: {curr_epoch} / {totalEpochs + numEpochs}</div>
          <div>Loss: {typeof curr_loss === 'number' ? curr_loss.toFixed(4) : curr_loss}</div>
          <div>Accuracy: {typeof curr_acc === 'number' ? (curr_acc * 100).toFixed(2) + '%' : curr_acc}</div>
          <div>Status: {is_training ? "Training" : curr_phase}</div>
        </div>
      </div>
      
      {!isStylesLoaded && <ControlPanelStyles />}
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
