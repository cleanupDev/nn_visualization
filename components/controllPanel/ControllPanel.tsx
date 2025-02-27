"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useModelStore } from '@/components/store';
import * as tf from "@tensorflow/tfjs";
import { Play, Pause, SkipForward, Clock, Zap, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";
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
    should_pause,
    animationSpeed,
    setCurrAcc,
    setCurrLoss,
    setCurrPhase,
    setCurrEpoch,
    setIsTraining,
    setShouldPause,
    setAnimationSpeed,
    trainingData,
    selectedDataset,
    currentOptimizer,
    currentLossFunction,
    learningRate,
    momentumValue,
    createModelAndLoadData,
    updateWeightsAndBiases,
    rebuildModelFromLayers
  } = useModelStore();

  const [isStylesLoaded, setIsStylesLoaded] = useState(false);
  const [animationInterval, setAnimationInterval] = useState<NodeJS.Timeout | null>(null);
  const [numEpochs, setNumEpochs] = useState(50); // Default number of epochs
  // Track total epochs across multiple training sessions
  const [totalEpochs, setTotalEpochs] = useState(0);
  // Track if model has been trained before
  const [hasBeenTrained, setHasBeenTrained] = useState(false);
  // Add state for panel expansion
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  
  // Use ref for pause status to ensure callbacks have access to current value
  const shouldPauseRef = useRef(false);
  
  // Keep the ref in sync with the store state
  useEffect(() => {
    shouldPauseRef.current = should_pause;
  }, [should_pause]);

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
      setHasBeenTrained(true);
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
    
    // If we're already training and the pause button is clicked
    if (is_training) {
      // Set both the ref and the state
      shouldPauseRef.current = true;
      setShouldPause(true);
      console.log("Pause requested - will stop after current epoch");
      return;
    }
    
    // Reset pause flag when starting/continuing training
    shouldPauseRef.current = false;
    setShouldPause(false);
    setIsTraining(true);
    
    // Reset epoch counter only if not continuing from previous training
    if (!continueTraining) {
      setCurrEpoch(0);
      setTotalEpochs(0);
    }

    // Reset the model's stopTraining flag when starting new training
    if (model.stopTraining) {
      model.stopTraining = false;
    }

    try {
      // Clean up previous animation interval if it exists
      if (animationInterval) {
        clearInterval(animationInterval);
      }
      
      // Determine update frequency based on dataset
      // Less frequent updates for complex datasets to improve performance
      const updateFrequency = selectedDataset === 'mnist' ? 
        Math.max(5, animationSpeed) : // Update less frequently for MNIST
        1000 / animationSpeed; // Regular update frequency for simpler datasets
      
      const intervalId = setInterval(() => {
        if (model) {
          updateWeightsAndBiases(model);
        }
      }, updateFrequency);
      
      setAnimationInterval(intervalId);
      
      // Get start epoch based on continuation mode
      const startEpoch = continueTraining ? totalEpochs : 0;
      const epochsToTrain = numEpochs;
      
      console.log(`Training from epoch ${startEpoch} for ${epochsToTrain} epochs`);
    
      // Determine optimal batch size based on dataset
      const batchSize = selectedDataset === 'mnist' ? 128 : 32;
      
      // Enable tensor memory cleanup during training without using tidy
      tf.engine().startScope();
      
      const history = await model.fit(trainingData.xs, trainingData.ys, {
        epochs: epochsToTrain,
        batchSize: batchSize,
        callbacks: {
          onEpochBegin: async (epoch: number) => {
            // Update epoch counter with offset for continuation
            const currentEpoch = startEpoch + epoch;
            setCurrEpoch(currentEpoch + 1); // +1 because epoch is 0-indexed in the callback
            
            // Clean up tensors less frequently for better performance
            if (epoch % 5 === 0) {
              // Dispose unused tensors periodically without disrupting training
              tf.engine().endScope();
              tf.engine().startScope();
            }
          },
          onEpochEnd: async (epoch: number, logs: any) => {
            const currentEpoch = startEpoch + epoch;
            
            // Only log every few epochs for better performance
            if (epoch % (selectedDataset === 'mnist' ? 5 : 1) === 0) {
              console.log(
                `Epoch ${currentEpoch + 1}: Loss = ${logs.loss}, Accuracy = ${logs.acc || 'N/A'}`
              );
            }
            
            // Update state with the latest accuracy and loss after each epoch
            setCurrAcc(logs.acc || 0);
            setCurrLoss(logs.loss || 0);
            
            // Check if training should be paused after this epoch using the ref
            if (shouldPauseRef.current) {
              console.log(`Pausing training after epoch ${currentEpoch + 1}`);
              // Set a flag to stop training properly
              model.stopTraining = true;
            }
          },
        },
      });
      
      // End the scope after training completes
      tf.engine().endScope();
      
      // Clean up the animation interval
      if (animationInterval) {
        clearInterval(animationInterval);
        setAnimationInterval(null);
      }
      
      // Update total epochs tracker based on actual training performed
      setTotalEpochs(startEpoch + (history.history.loss?.length || 0));
      
      // Check if training was paused or completed normally
      if (shouldPauseRef.current) {
        // If paused, just set is_training to false but keep curr_phase as is
        setIsTraining(false);
        setShouldPause(false); // Reset pause flag
        shouldPauseRef.current = false; // Also reset the ref
        console.log("Training paused");
      } else {
        // If completed normally, update the phase
        setIsTraining(false);
        setCurrPhase("trained");
        console.log("Training completed");
      }
      
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
      setShouldPause(false);
      shouldPauseRef.current = false; // Reset the ref
      setCurrPhase("error");
    }
  };
  
  const stepForward = () => {
    if (model) {
      updateWeightsAndBiases(model);
    }
  };

  const resetModel = () => {
    // Only reset if model exists and is not currently training
    if (model && !is_training) {
      // Recreate model for current dataset
      if (selectedDataset) {
        createModelAndLoadData(selectedDataset);
        setTotalEpochs(0);
        setCurrEpoch(0);
        setCurrAcc("N/A");
        setCurrLoss("N/A");
        setCurrPhase("ready");
        setHasBeenTrained(false);
      }
    }
  };

  if (!isPanelExpanded) {
    return (
      <div 
        className={cn(
          "z-10 rounded-md border border-zinc-800 bg-black/90 backdrop-blur-sm transition-all duration-200 min-w-[320px] cursor-pointer hover:bg-zinc-900/90 hover:border-zinc-700",
          isStylesLoaded ? "opacity-100" : "opacity-0"
        )}
        onClick={() => setIsPanelExpanded(true)}
      >
        <Card className="border-zinc-800 bg-transparent shadow-none">
          <CardHeader className="py-3 px-5">
            <CardTitle className="flex items-center justify-between font-mono text-sm font-medium text-zinc-300">
              <div className="flex items-center">
                <Zap className="mr-2 h-4 w-4" />
                TRAINING.CONTROL
              </div>
              <div className="h-6 w-6 flex items-center justify-center">
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      "z-10 rounded-md border border-zinc-800 bg-black/90 backdrop-blur-sm transition-all duration-200 min-w-[320px]",
      isStylesLoaded ? "opacity-100" : "opacity-0"
    )}>
      <Card className="border-zinc-800 bg-transparent shadow-none">
        <CardHeader className="py-3 px-5">
          <CardTitle className="flex items-center justify-between font-mono text-sm font-medium text-zinc-300">
            <div className="flex items-center">
              <Zap className="mr-2 h-4 w-4" />
              TRAINING.CONTROL
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPanelExpanded(false)}
              className="h-6 w-6 p-0 flex items-center justify-center text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/60"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 px-5">
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
              onClick={() => startTraining(hasBeenTrained)}
              disabled={!model}
              className="flex-1 h-10 border-zinc-800 bg-black/50 font-mono text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300"
            >
              {is_training ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {is_training ? "PAUSE" : hasBeenTrained ? "CONTINUE" : "TRAIN"}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={resetModel}
              disabled={is_training || !hasBeenTrained}
              className="flex-1 h-10 border-zinc-800 bg-black/50 font-mono text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300 disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              RESET
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
              <span className="text-zinc-500">OPTIMIZER</span>
              <span className="text-blue-400">
                {currentOptimizer}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">LEARNING RATE</span>
              <span className="text-blue-400">
                {learningRate}
              </span>
            </div>
            {momentumValue !== null && (
              <div className="flex justify-between">
                <span className="text-zinc-500">MOMENTUM</span>
                <span className="text-blue-400">
                  {momentumValue}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">LOSS</span>
              <span className="text-blue-400">
                {currentLossFunction}
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
