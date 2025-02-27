"use client";

import React, { useState, useEffect, useRef } from "react";
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
    getRandomMnistTestImage,
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
  const [randomImageLabel, setRandomImageLabel] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
        if (selectedDataset === 'xor') {
          setConfidence(outputValues.map(v => v * 100));
        } else if (selectedDataset === 'mnist') {
          // The softmax is now applied in the model's output layer,
          // so we just need to convert to percentages
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
    // Clear the drawing
    setMnistDrawing(Array(784).fill(0));
    setInferenceInput(Array(784).fill(0));
    setRandomImageLabel(null);
  };

  // Function to handle selecting a random MNIST image
  const handleSelectRandomMnistImage = () => {
    const randomImage = getRandomMnistTestImage();
    if (randomImage) {
      setMnistDrawing(randomImage.image);
      setInferenceInput(randomImage.image);
      setRandomImageLabel(randomImage.label);
    }
  };

  // MNIST display component for visualizing the 28x28 image
  const MnistImageDisplay = ({ pixels }: { pixels: number[] }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastPositionRef = useRef<{x: number, y: number} | null>(null);
    // Track drawing state locally in component
    const drawingRef = useRef<boolean>(false);
    // Track update timing
    const lastUpdateRef = useRef<number>(0);
    
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the image
      const imageData = ctx.createImageData(28, 28);
      const data = imageData.data;
      
      for (let i = 0; i < 784; i++) {
        const value = Math.floor(pixels[i] * 255);
        data[i * 4] = value;     // R
        data[i * 4 + 1] = value; // G
        data[i * 4 + 2] = value; // B
        data[i * 4 + 3] = 255;   // A
      }
      
      // Create a temporary canvas to scale the image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 28;
      tempCanvas.height = 28;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      
      tempCtx.putImageData(imageData, 0, 0);
      
      // Scale the image to fit the canvas
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tempCanvas, 0, 0, 28, 28, 0, 0, canvas.width, canvas.height);
    }, [pixels]);

    // Set up drawing event handlers as direct DOM listeners for better control
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const getCoords = (e: MouseEvent | TouchEvent): {x: number, y: number} | null => {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if ('touches' in e) {
          if (e.touches.length === 0) return null;
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }
        
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        return { x, y };
      };
      
      const draw = (x: number, y: number) => {
        if (!lastPositionRef.current) {
          // First point - just draw a dot
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw a line from the last position to the current position
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 20;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          ctx.moveTo(lastPositionRef.current.x, lastPositionRef.current.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        
        lastPositionRef.current = { x, y };
        
        // Occasionally update the MNIST array during drawing
        const now = Date.now();
        if (now - lastUpdateRef.current > 300) {
          updateMnistArray();
          lastUpdateRef.current = now;
        }
      };
      
      const startDrawing = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        
        const coords = getCoords(e);
        if (!coords) return;
        
        drawingRef.current = true;
        setIsDrawing(true);
        
        // Draw initial dot
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        lastPositionRef.current = coords;
      };
      
      const continueDrawing = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        
        if (!drawingRef.current) return;
        
        const coords = getCoords(e);
        if (!coords) return;
        
        draw(coords.x, coords.y);
      };
      
      const stopDrawing = () => {
        if (drawingRef.current) {
          drawingRef.current = false;
          setIsDrawing(false);
          lastPositionRef.current = null;
          updateMnistArray();
          lastUpdateRef.current = 0;
        }
      };
      
      // Mouse events
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', continueDrawing);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);
      
      // Touch events
      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', continueDrawing, { passive: false });
      canvas.addEventListener('touchend', stopDrawing);
      
      // Global event to catch mouse up outside canvas
      window.addEventListener('mouseup', stopDrawing);
      
      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', continueDrawing);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseleave', stopDrawing);
        
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', continueDrawing);
        canvas.removeEventListener('touchend', stopDrawing);
        
        window.removeEventListener('mouseup', stopDrawing);
      };
    }, []);
    
    // Update MNIST array from canvas data
    const updateMnistArray = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Create a temporary canvas at 28x28 resolution (MNIST size)
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 28;
      tempCanvas.height = 28;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      
      // Draw the current canvas to this smaller canvas
      tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 28, 28);
      
      // Get the pixel data
      const imageData = tempCtx.getImageData(0, 0, 28, 28);
      const data = imageData.data;
      
      // Convert to MNIST format (0-1 values in a 784 length array)
      const mnistArray = new Array(784);
      for (let i = 0; i < 784; i++) {
        // Get the red channel (all RGB channels are the same in grayscale)
        // and normalize to 0-1
        mnistArray[i] = data[i * 4] / 255;
      }
      
      // Update the parent component's state
      setMnistDrawing(mnistArray);
      setInferenceInput(mnistArray);
      
      // Clear random image label since we're drawing our own
      setRandomImageLabel(null);
    };
    
    return (
      <canvas 
        ref={canvasRef} 
        width={140} 
        height={140}
        className="border border-zinc-700 bg-black cursor-crosshair"
      />
    );
  };

  const renderDatasetInputs = () => {
    if (selectedDataset === 'xor') {
      return (
        <div className="space-y-4 w-full">
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
        <div className="space-y-4 w-full">
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
        <div className="space-y-4 w-full overflow-hidden">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-zinc-500 mb-0">MNIST Digit Recognition</p>
              <p className="text-xs text-zinc-400">
                Draw a digit (0-9) with your mouse or finger
              </p>
            </div>
            
            {/* Display the MNIST image with a wrapper for indicator */}
            <div className="relative flex justify-center w-full">
              <MnistImageDisplay pixels={mnistDrawing} />
              {isDrawing && (
                <div className="absolute top-2 right-2 bg-emerald-500/80 text-white text-xs px-2 py-1 rounded-full">
                  Drawing...
                </div>
              )}
            </div>
            
            {/* Show actual label if available from random selection */}
            {randomImageLabel !== null ? (
              <div className="text-xs text-zinc-400">
                Actual digit: <span className="font-bold text-blue-400">{randomImageLabel}</span>
              </div>
            ) : (
              <div className="h-4"></div> // Empty space to maintain layout
            )}
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetMnistDrawing}
                className="h-8 border-zinc-800 bg-black/50 font-mono text-xs text-zinc-400 hover:bg-red-950/30 hover:border-red-800/50"
              >
                Clear Canvas
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectRandomMnistImage}
                className="h-8 border-zinc-800 bg-black/50 font-mono text-xs text-zinc-400 hover:bg-blue-950/30 hover:border-blue-800/50"
              >
                Random Example
              </Button>
            </div>
            
            <div className="text-center text-zinc-500 text-xs italic">
              After drawing, click &ldquo;Run Inference&rdquo; to predict the digit
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
          "z-10 rounded-md border border-zinc-800 bg-black/90 backdrop-blur-sm transition-all duration-200 w-[320px] mt-4 cursor-pointer hover:bg-zinc-900/90 hover:border-zinc-700",
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
      "z-10 rounded-md border border-zinc-800 bg-black/90 backdrop-blur-sm transition-all duration-200 w-[320px] mt-4",
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