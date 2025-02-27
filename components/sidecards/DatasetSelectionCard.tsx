"use client";

import React from "react";
import { useModelStore } from "@/components/store";
import { Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import * as tf from "@tensorflow/tfjs";
import { Scatter, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ScatterController,
} from 'chart.js';
import { Loader2 } from "lucide-react";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ScatterController
);

const DatasetSelectionCard = () => {
  const { 
    selectedDataset,
    trainingData,
    createModelAndLoadData,
    isLoading
  } = useModelStore();

  // Add state to track if MNIST data has been loaded
  const [mnistLoaded, setMnistLoaded] = React.useState(false);

  // Update mnistLoaded state when trainingData changes
  React.useEffect(() => {
    if (selectedDataset === 'mnist' && trainingData) {
      setMnistLoaded(true);
    }
  }, [selectedDataset, trainingData]);

  const handleDatasetChange = (value: string) => {
    createModelAndLoadData(value as 'xor' | 'sine' | 'mnist');
  };

  // Determine MNIST button text and style based on cached state
  const getMnistButtonText = () => {
    if (isLoading && selectedDataset === 'mnist') {
      return (
        <>
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          LOADING MNIST...
        </>
      );
    }
    if (mnistLoaded) {
      return "MNIST";
    }
    return "LOAD MNIST.DATA";
  };

  const mnistButtonClassName = `mt-2 w-full font-mono text-xs ${
    selectedDataset === 'mnist' 
      ? 'border-zinc-700 bg-zinc-900 text-zinc-300' 
      : 'border-zinc-800 bg-black/50 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
  }`;

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center font-mono text-sm font-medium text-zinc-300">
          <Settings className="mr-2 h-4 w-4" />
          DATASET.CONFIG
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedDataset && selectedDataset !== 'mnist' ? selectedDataset : ''}
          className="grid grid-cols-2 gap-2"
          onValueChange={handleDatasetChange}
        >
          <Label
            htmlFor="xor"
            className={`flex cursor-pointer items-center justify-center rounded-md border border-zinc-800 bg-black/50 p-4 font-mono text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300 [&:has([data-state=checked])]:border-zinc-700 [&:has([data-state=checked])]:bg-zinc-900 [&:has([data-state=checked])]:text-zinc-300 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <RadioGroupItem value="xor" id="xor" className="sr-only" disabled={isLoading} />
            XOR
          </Label>
          <Label
            htmlFor="sine"
            className={`flex cursor-pointer items-center justify-center rounded-md border border-zinc-800 bg-black/50 p-4 font-mono text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300 [&:has([data-state=checked])]:border-zinc-700 [&:has([data-state=checked])]:bg-zinc-900 [&:has([data-state=checked])]:text-zinc-300 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <RadioGroupItem value="sine" id="sine" className="sr-only" disabled={isLoading} />
            SINE
          </Label>
        </RadioGroup>
        <Button
          className={mnistButtonClassName}
          variant="outline"
          onClick={() => handleDatasetChange('mnist')}
          disabled={isLoading}
        >
          {getMnistButtonText()}
        </Button>
        
        <div className="mt-4 space-y-2 rounded-lg border border-zinc-800 bg-black/50 p-3">
          <DataPreview />
        </div>
      </CardContent>
    </Card>
  );
};

const DataPreview = () => {
    const { selectedDataset, trainingData, inputShape } = useModelStore();

    if (!selectedDataset) {
        return <div className="text-xs text-zinc-500">Select a dataset to preview</div>;
    }

    let inputDim = inputShape.join(" x ");
    let outputDim = "1"; // Default for XOR and Sine
    if (selectedDataset === 'mnist') {
        outputDim = "10 (one-hot encoded)";
    }

    return (
        <div className="space-y-2">
            <div className="font-mono text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>INPUT.DIM</span>
                  <span className="text-zinc-300">{inputDim}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>OUTPUT.DIM</span>
                  <span className="text-zinc-300">{outputDim}</span>
                </div>
            </div>
            <div className="mt-3">
              {selectedDataset === 'xor' && <XORPreview />}
              {selectedDataset === 'sine' && <SinePreview />}
              {selectedDataset === 'mnist' && <MNISTPreview trainingData={trainingData} />}
            </div>
        </div>
    );
};

const XORPreview = () => {
    const xorData = [
        { x: 0, y: 0, label: 0 },
        { x: 0, y: 1, label: 1 },
        { x: 1, y: 0, label: 1 },
        { x: 1, y: 1, label: 0 },
    ];

    const chartData = {
        datasets: [
            {
                label: 'XOR Data',
                data: xorData.map(d => ({ x: d.x, y: d.y })),
                backgroundColor: xorData.map(d => d.label === 0 ? 'rgb(255, 99, 132)' : 'rgb(54, 162, 235)'),
                pointRadius: 10,
            },
        ],
    };

    const chartOptions = {
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: {
                title: { display: true, text: 'Input 1', color: '#e0e0e0' },
                min: -0.1,
                max: 1.1,
                ticks: { color: '#e0e0e0', stepSize: 1 },
            },
            y: {
                title: { display: true, text: 'Input 2', color: '#e0e0e0' },
                min: -0.1,
                max: 1.1,
                ticks: { color: '#e0e0e0', stepSize: 1 },
            },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="w-full aspect-square">
            <Scatter data={chartData} options={chartOptions} />
        </div>
    );
};

const SinePreview = () => {
    const points = [];
    for (let i = 0; i < 50; i++) {
        const x = (i / 49) * Math.PI * 2;
        const y = Math.sin(x);
        points.push({ x, y });
    }

    const chartData = {
        labels: points.map(p => p.x.toFixed(2)),
        datasets: [
            {
                label: 'Sine Wave',
                data: points.map(p => p.y),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                pointRadius: 0,
                fill: false,
            },
        ],
    };
      const chartOptions = {
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'x',
                    color: '#e0e0e0',
                },
                ticks:{
                    color: '#e0e0e0',
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'sin(x)',
                    color: '#e0e0e0',
                },
                min: -1.1,
                max: 1.1,
                ticks:{
                    color: '#e0e0e0',
                }
            },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="w-full aspect-video">
            <Line data={chartData} options={chartOptions}/>
        </div>
    );
};

const MNISTPreview = ({ trainingData }: { trainingData: { xs: tf.Tensor; ys: tf.Tensor } | null }) => {
    if (!trainingData) return <p className="font-mono text-xs text-zinc-500">MNIST.DATA.LOADING...</p>;

    const canvasRefs = React.useRef<(HTMLCanvasElement | null)[]>([]);

    React.useEffect(() => {
        const renderImages = async () => {
            const numImages = 5;
            const imageTensor = trainingData.xs.slice([0, 0], [numImages, 784]);
            const imageArray = await imageTensor.array() as number[][];

            for (let i = 0; i < numImages; i++) {
                const canvas = canvasRefs.current[i];
                if (canvas) {
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        const imageData = ctx.createImageData(28, 28);
                        for (let j = 0; j < 784; j++) {
                            const pixelValue = imageArray[i][j] * 255;
                            imageData.data[j * 4] = pixelValue;
                            imageData.data[j * 4 + 1] = pixelValue;
                            imageData.data[j * 4 + 2] = pixelValue;
                            imageData.data[j * 4 + 3] = 255;
                        }
                        ctx.putImageData(imageData, 0, 0);
                    }
                }
            }
        };

        renderImages();
    }, [trainingData]);

    return (
        <div className="flex flex-wrap gap-2 justify-center">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-20 group-hover:opacity-50 rounded-sm blur-sm transition duration-200"></div>
                    <canvas
                        ref={(el) => (canvasRefs.current[i] = el)}
                        width={28}
                        height={28}
                        className="relative w-12 h-12 bg-black rounded-sm border border-zinc-800"
                    ></canvas>
                </div>
            ))}
        </div>
    );
};

export default DatasetSelectionCard; 