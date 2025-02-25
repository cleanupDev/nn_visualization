"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useModelStore } from '@/components/store';
import * as tf from "@tensorflow/tfjs";
import { Play, Pause, SkipForward, Clock, Zap } from "lucide-react";
import { Slider } from "../ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  
  const stepForward = () => {
    if (model) {
      updateWeightsAndBiases(model);
    }
  };

  return (
    <div className={cn(
      "z-10 rounded-md border border-zinc-800 bg-black/90 backdrop-blur-sm transition-opacity duration-300",
      isStylesLoaded ? "opacity-100" : "opacity-0"
    )}>
      <Card className="border-zinc-800 bg-transparent shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center font-mono text-sm font-medium text-zinc-300">
            <Zap className="mr-2 h-4 w-4" />
            TRAINING.CONTROL
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs text-zinc-500">EPOCHS</Label>
              <span className="font-mono text-xs text-zinc-400">{numEpochs}</span>
            </div>
            <Slider
              value={[numEpochs]}
              min={10}
              max={500}
              step={10}
              disabled={is_training}
              onValueChange={(values) => setNumEpochs(values[0])}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-zinc-800 [&_[role=slider]]:bg-zinc-900"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs text-zinc-500">ANIMATION.SPEED</Label>
              <span className="font-mono text-xs text-zinc-400">{animationSpeed} FPS</span>
            </div>
            <Slider
              value={[animationSpeed]}
              min={1}
              max={60}
              step={1}
              disabled={is_training}
              onValueChange={(values) => setAnimationSpeed(values[0])}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-zinc-800 [&_[role=slider]]:bg-zinc-900"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => startTraining(false)}
              disabled={is_training || !model}
              className="flex-1 h-10 border-zinc-800 bg-black/50 font-mono text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300"
            >
              {is_training ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {is_training ? "PAUSE" : "TRAIN"}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={stepForward}
              disabled={is_training || !model}
              className="flex-1 h-10 border-zinc-800 bg-black/50 font-mono text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              STEP
            </Button>
          </div>
          
          <div className="space-y-2 rounded-lg border border-zinc-800 bg-black/50 p-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">EPOCH.CURRENT</span>
              <span className="text-zinc-300">{curr_epoch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">LOSS.CURRENT</span>
              <span className="text-emerald-400">
                {typeof curr_loss === 'number' ? curr_loss.toFixed(4) : curr_loss}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">ACCURACY</span>
              <span className="text-emerald-400">
                {typeof curr_acc === 'number' ? (curr_acc * 100).toFixed(2) + '%' : curr_acc}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">STATUS</span>
              <span className="text-zinc-300">{is_training ? "TRAINING" : curr_phase.toUpperCase()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ControlPanel;
