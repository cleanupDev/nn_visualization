'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { useState, useCallback } from 'react'
import { NeuralNetController } from '@/components/visualization/neuralNetController'
import { ImprovedButtonControlledSidebarMenu } from '@/components/sidecards/improved-button-controlled-sidebar-menu'
import ControllPanel from '@/components/controllPanel/ControllPanel'
import LayerControlCard from '@/components/sidecards/LayerControllCard'
import LayerInfoCard from '@/components/sidecards/LayerInfoCard'

const NeuralNetVisualization = dynamic(() => import('@/components/visualization/neural-net-visualization'), { ssr: false })

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
        <div className='absolute top-0 left-5'>
          <ControllPanel />
        </div>
      </NeuralNetVisualization>
      <ImprovedButtonControlledSidebarMenu>
        <LayerControlCard />
        <LayerInfoCard />
        {/* Add more cards here in the future */}
      </ImprovedButtonControlledSidebarMenu>
    </ErrorBoundary>
  )
}