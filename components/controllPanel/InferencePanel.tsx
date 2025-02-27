"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useModelStore } from '@/components/store';
import * as tf from "@tensorflow/tfjs";
import { Play, Zap, Brain, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

const InferencePanel = () => {
  const {
    model,
    selectedDataset,
    curr_phase,
    inputShape,
  } = useModelStore();

  const [isStylesLoaded, setIsStylesLoaded] = useState(false);
  const [inferenceInput, setInferenceInput] = useState<number[]>([]);
  const [inferenceResult, setInferenceResult] = useState<number[] | null>(null);
  const [confidence, setConfidence] = useState<number[]>([]);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [mnistDrawing, setMnistDrawing] = useState<number[]>(Array(784).fill(0));
  const [xValue1, setXValue1] = useState(0);
  const [xValue2, setXValue2] = useState(0);
  const [sineX, setSineX] = useState(0);
  const [lastInferredInput, setLastInferredInput] = useState<number[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsStylesLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Initialize appropriate default inputs based on dataset
    if (selectedDataset === 'xor') {
      setInferenceInput([0, 0]);
      setXValue1(0);
      setXValue2(0);
    } else if (selectedDataset === 'sine') {
      setInferenceInput([0]);
      setSineX(0);
    } else if (selectedDataset === 'mnist') {
      setInferenceInput(Array(784).fill(0));
      setMnistDrawing(Array(784).fill(0));
    }
    
    // Reset inference results when switching datasets
    setInferenceResult(null);
    setConfidence([]);
    setLastInferredInput([]);
  }, [selectedDataset]);

  const runInference = async () => {
    if (!model || !inferenceInput.length) return;

    try {
      // Convert input to tensor with appropriate shape
      let inputTensor;
      if (selectedDataset === 'mnist') {
        inputTensor = tf.tensor2d(inferenceInput, [1, 784]);
      } else if (selectedDataset === 'xor') {
        inputTensor = tf.tensor2d(inferenceInput, [1, 2]);
      } else if (selectedDataset === 'sine') {
        inputTensor = tf.tensor2d(inferenceInput, [1, 1]);
      } else {
        return;
      }

      // Run prediction
      const result = model.predict(inputTensor) as tf.Tensor;
      
      // Convert result to array
      const resultArray = await result.array() as number[][];
      
      // Clean up tensors
      inputTensor.dispose();
      result.dispose();
      
      if (resultArray && resultArray.length > 0) {
        const outputValues = resultArray[0];
        setInferenceResult(outputValues);
        
        // Store the input value that was used for inference
        setLastInferredInput([...inferenceInput]);
        
        // For classification tasks (XOR, MNIST), calculate confidence
        if (selectedDataset === 'xor' || selectedDataset === 'mnist') {
          setConfidence(outputValues.map(v => v * 100));
        }
      }
    } catch (error) {
      console.error("Inference error:", error);
    }
  };

  const updateXorInputs = (index: number, value: number) => {
    const newInputs = [...inferenceInput];
    newInputs[index] = value;
    setInferenceInput(newInputs);
    
    if (index === 0) {
      setXValue1(value);
    } else {
      setXValue2(value);
    }
  };

  const updateSineInput = (value: number) => {
    setSineX(value);
    setInferenceInput([value]);
  };

  // Simplified MNIST drawing handling for now
  const resetMnistDrawing = () => {
    setMnistDrawing(Array(784).fill(0));
    setInferenceInput(Array(784).fill(0));
  };

  const renderDatasetInputs = () => {
    if (selectedDataset === 'xor') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs text-zinc-500">INPUT X1 ({xValue1})</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateXorInputs(0, 0)}
                className={cn(
                  "h-8 border-zinc-800 bg-black/50 font-mono text-xs",
                  xValue1 === 0 ? "bg-zinc-800 text-zinc-200" : "text-zinc-400"
                )}
              >
                0
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateXorInputs(0, 1)}
                className={cn(
                  "h-8 border-zinc-800 bg-black/50 font-mono text-xs",
                  xValue1 === 1 ? "bg-zinc-800 text-zinc-200" : "text-zinc-400"
                )}
              >
                1
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs text-zinc-500">INPUT X2 ({xValue2})</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateXorInputs(1, 0)}
                className={cn(
                  "h-8 border-zinc-800 bg-black/50 font-mono text-xs",
                  xValue2 === 0 ? "bg-zinc-800 text-zinc-200" : "text-zinc-400"
                )}
              >
                0
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateXorInputs(1, 1)}
                className={cn(
                  "h-8 border-zinc-800 bg-black/50 font-mono text-xs",
                  xValue2 === 1 ? "bg-zinc-800 text-zinc-200" : "text-zinc-400"
                )}
              >
                1
              </Button>
            </div>
          </div>
        </div>
      );
    } else if (selectedDataset === 'sine') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs text-zinc-500">INPUT X ({sineX.toFixed(2)})</Label>
            </div>
            <Slider
              value={[sineX]}
              min={0}
              max={Math.PI * 2}
              step={0.01}
              onValueChange={(values) => updateSineInput(values[0])}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-zinc-800 [&_[role=slider]]:bg-zinc-900"
            />
            <div className="flex justify-between text-zinc-500 text-xs">
              <span>0</span>
              <span>π</span>
              <span>2π</span>
            </div>
          </div>
        </div>
      );
    } else if (selectedDataset === 'mnist') {
      return (
        <div className="space-y-4">
          <div className="flex justify-center items-center">
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-2">MNIST drawing not implemented in this version</p>
              <Button
                variant="outline"
                size="sm"
                onClick={resetMnistDrawing}
                className="h-8 border-zinc-800 bg-black/50 font-mono text-xs text-zinc-400"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-center text-zinc-500 text-xs">
        No model trained yet
      </div>
    );
  };

  const renderInferenceResults = () => {
    if (!inferenceResult || inferenceResult.length === 0) {
      return (
        <div className="text-center text-zinc-500 text-xs py-2">
          Run inference to see results
        </div>
      );
    }

    if (selectedDataset === 'xor') {
      const prediction = inferenceResult[0] > 0.5 ? 1 : 0;
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500">PREDICTION</span>
            <span className="text-emerald-400 font-bold">{prediction}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">CONFIDENCE</span>
            <span className="text-emerald-400">
              {confidence[0] ? 
                prediction === 1 ? 
                  `${confidence[0].toFixed(2)}%` : 
                  `${(100 - confidence[0]).toFixed(2)}%` 
                : '0%'}
            </span>
          </div>
        </div>
      );
    } else if (selectedDataset === 'sine') {
      // Use the lastInferredInput for calculations
      const inferredX = lastInferredInput[0];
      const actualSine = Math.sin(inferredX);
      const error = Math.abs(inferenceResult[0] - actualSine);
      
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500">PREDICTED Y</span>
            <span className="text-emerald-400">{inferenceResult[0].toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">ACTUAL SINE</span>
            <span className="text-blue-400">{actualSine.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">ERROR</span>
            <span className="text-yellow-400">{error.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">INFERRED X</span>
            <span className="text-zinc-400">{inferredX.toFixed(4)}</span>
          </div>
        </div>
      );
    } else if (selectedDataset === 'mnist') {
      // Find the index with highest probability
      const predictedDigit = inferenceResult.indexOf(Math.max(...inferenceResult));
      const maxConfidence = confidence[predictedDigit];
      
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500">PREDICTED DIGIT</span>
            <span className="text-emerald-400 font-bold">{predictedDigit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">CONFIDENCE</span>
            <span className="text-emerald-400">
              {maxConfidence !== undefined ? `${maxConfidence.toFixed(2)}%` : '0%'}
            </span>
          </div>
        </div>
      );
    }
  };

  if (!isPanelExpanded) {
    return (
      <div 
        className={cn(
          "z-10 rounded-md border border-zinc-800 bg-black/90 backdrop-blur-sm transition-all duration-200 min-w-[320px] mt-4 cursor-pointer hover:bg-zinc-900/90 hover:border-zinc-700",
          isStylesLoaded ? "opacity-100" : "opacity-0"
        )}
        onClick={() => setIsPanelExpanded(true)}
      >
        <Card className="border-zinc-800 bg-transparent shadow-none">
          <CardHeader className="py-3 px-5">
            <CardTitle className="flex items-center justify-between font-mono text-sm font-medium text-zinc-300">
              <div className="flex items-center">
                <Brain className="mr-2 h-4 w-4" />
                INFERENCE.CONTROL
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
      "z-10 rounded-md border border-zinc-800 bg-black/90 backdrop-blur-sm transition-all duration-200 min-w-[320px] mt-4",
      isStylesLoaded ? "opacity-100" : "opacity-0"
    )}>
      <Card className="border-zinc-800 bg-transparent shadow-none">
        <CardHeader className="py-3 px-5">
          <CardTitle className="flex items-center justify-between font-mono text-sm font-medium text-zinc-300">
            <div className="flex items-center">
              <Brain className="mr-2 h-4 w-4" />
              INFERENCE.CONTROL
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
          {renderDatasetInputs()}
          
          <Button
            variant="outline"
            size="sm"
            onClick={runInference}
            disabled={!model || curr_phase !== "trained"}
            className="w-full h-10 border-zinc-800 bg-black/50 font-mono text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300"
          >
            <Play className="h-4 w-4 mr-2" />
            RUN INFERENCE
          </Button>
          
          <div className="space-y-2 rounded-lg border border-zinc-800 bg-black/50 p-3 font-mono text-xs">
            {renderInferenceResults()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InferencePanel; 