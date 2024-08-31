'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'

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
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <NeuralNetVisualization>
        <div className="container mx-auto p-4 relative">
          <h1 className="text-2xl font-bold mb-4 text-white">Neural Network Visualization Test</h1>
          <p className="text-white">This is an example of content overlaid on the neural network visualization.</p>
        </div>
      </NeuralNetVisualization>
    </ErrorBoundary>
  )
}