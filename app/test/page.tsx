'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { useState, useCallback } from 'react'
import { NeuralNetController } from '@/components/testingComponents/neuralNetController'

const NeuralNetVisualization = dynamic(() => import('@/components/testingComponents/neural-net-visualization'), { ssr: false })

function ErrorFallback({ error }: FallbackProps) {
  return (
    <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
      <p className="font-bold">Something went wrong:</p>
      <pre className="mt-2">{error.message}</pre>
    </div>
  )
}

export default function TestPage() {
  const [controller] = useState(() => {
    console.log("Creating NeuralNetController in TestPage");
    return new NeuralNetController([3, 4, 4, 2]);
  });

  const addNeuron = useCallback((layer: number) => {
    console.log(`Adding neuron to layer ${layer}`);
    controller.addNeuron(layer);
    console.log("Controller after adding neuron:", controller.getNeurons());
    // Update the visualization
    if (typeof window !== 'undefined' && (window as any).updateNeuralNetVisualization) {
      console.log("Calling updateNeuralNetVisualization");
      (window as any).updateNeuralNetVisualization();
    } else {
      console.log("updateNeuralNetVisualization is not available");
    }
  }, [controller]);

  const removeNeuron = useCallback(() => {
    const neurons = controller.getNeurons();
    if (neurons.length > 0) {
      console.log(`Removing neuron: ${neurons[0].id}`);
      controller.removeNeuron(neurons[0].id);
      console.log("Controller after removing neuron:", controller.getNeurons());
      // Update the visualization
      if (typeof window !== 'undefined' && (window as any).updateNeuralNetVisualization) {
        console.log("Calling updateNeuralNetVisualization");
        (window as any).updateNeuralNetVisualization();
      } else {
        console.log("updateNeuralNetVisualization is not available");
      }
    } else {
      console.log("No neurons to remove");
    }
  }, [controller]);

  console.log("Rendering TestPage");

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <NeuralNetVisualization controller={controller}>
        <div className="container mx-auto p-4 relative">
          <h1 className="text-2xl font-bold mb-4 text-white">Neural Network Visualization Test</h1>
          <p className="text-white mb-4">This is an example of content overlaid on the neural network visualization.</p>
          <div className="flex space-x-2">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => addNeuron(1)}
            >
              Add Neuron to Layer 1
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={removeNeuron}
            >
              Remove First Neuron
            </button>
          </div>
        </div>
      </NeuralNetVisualization>
    </ErrorBoundary>
  )
}