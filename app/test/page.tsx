'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { useEffect } from 'react'
import { NeuralNetController } from '@/components/visualization/neuralNetController'
import { ImprovedButtonControlledSidebarMenu } from '@/components/sidecards/improved-button-controlled-sidebar-menu'
import ControllPanel from '@/components/controllPanel/ControllPanel'
import LayerControlCard from '@/components/sidecards/LayerControllCard'
import LayerInfoCard from '@/components/sidecards/LayerInfoCard'
import { useModelStore } from '@/components/store'

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
  const { layers, neurons } = useModelStore()

  useEffect(() => {
    // Initialize the store with some default layers if it's empty
    if (layers.length === 0) {
      useModelStore.getState().setLayers([
        { name: 'Hidden 1', neurons: 4 },
        { name: 'Hidden 2', neurons: 4 },
      ])
    }
  }, [layers])

  const controller = new NeuralNetController()

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
      </ImprovedButtonControlledSidebarMenu>
    </ErrorBoundary>
  )
}