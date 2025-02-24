"use client";

import React from "react";
import { useModelStore } from "@/components/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { selectedDataset, trainingData } = useModelStore();

  // Helper function to get dataset display name
  const getDatasetDisplayName = (dataset: string | null) => {
    switch(dataset) {
      case 'xor': return 'XOR Problem';
      case 'sine': return 'Sine Wave Function';
      case 'mnist': return 'MNIST Handwritten Digits';
      default: return 'No Dataset Selected';
    }
  };

  return (
    <Card className="bg-[#31303b] border-none text-white">
      <CardHeader>
        <CardTitle>Dataset Information</CardTitle>
        <CardDescription>Currently using: <span className="font-bold text-white">{getDatasetDisplayName(selectedDataset)}</span></CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DataPreview />
      </CardContent>
    </Card>
  );
};

const DataPreview = () => {
    const { selectedDataset, trainingData, inputShape } = useModelStore();

    if (!selectedDataset) {
        return <CardDescription>Select a dataset to preview.</CardDescription>;
    }

    let inputDim = inputShape.join(" x ");
    let outputDim = "1"; // Default for XOR and Sine
    if (selectedDataset === 'mnist') {
        outputDim = "10 (one-hot encoded)";
    }


    return (
        <div className="space-y-2">
            <CardDescription>
                <strong>Input Dimensions:</strong> {inputDim} <br />
                <strong>Output Dimensions:</strong> {outputDim}
            </CardDescription>
            {selectedDataset === 'xor' && <XORPreview />}
            {selectedDataset === 'sine' && <SinePreview />}
            {selectedDataset === 'mnist' && <MNISTPreview trainingData={trainingData} />}
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
    if (!trainingData) return <p>Loading MNIST data...</p>;

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
        <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
                <canvas
                    key={i}
                    ref={(el) => (canvasRefs.current[i] = el)}
                    width={28}
                    height={28}
                    className="border border-gray-600"
                ></canvas>
            ))}
        </div>
    );
};

export default DatasetSelectionCard; 