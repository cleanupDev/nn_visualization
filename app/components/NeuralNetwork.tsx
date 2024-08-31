import { useEffect, useRef } from 'react';

interface NeuralNetworkProps {
  layers: number[];
  weights: number[][][];
}

function NeuralNetwork({ layers, weights }: NeuralNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ... existing canvas setup code ...

    // Update neuron color
    const drawNeuron = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, 2 * Math.PI);
      ctx.fillStyle = '#1971c2'; // Updated neuron color
      ctx.fill();
    };

    // Update connection color based on weight
    const drawConnection = (startX: number, startY: number, endX: number, endY: number, weight: number) => {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = weight >= 0 ? '#2f9e44' : '#e03131'; // Green for positive, red for negative
      ctx.lineWidth = Math.abs(weight) * 5; // Adjust line width based on weight magnitude
      ctx.stroke();
    };

    // ... rest of the drawing logic ...

  }, [layers, weights]);

  return <canvas ref={canvasRef} />;
}

export default NeuralNetwork;