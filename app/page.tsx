'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { ImprovedButtonControlledSidebarMenu } from '@/components/sidecards/improved-button-controlled-sidebar-menu'
import ControllPanel from '@/components/controllPanel/ControllPanel'
import InferencePanel from '@/components/controllPanel/InferencePanel'
import LayerControlCard from '@/components/sidecards/LayerControllCard'
import LayerInfoCard from '@/components/sidecards/LayerInfoCard'
import { GitHubLink } from '@/components/GitHubLink'
import { FeedbackButtonComponent } from '@/components/feedback-button'
import { TutorialPopupComponent } from '@/components/tutorial-popup'
import { TutorialButton } from '@/components/tutorial-button'

const NeuralNetVisualization = dynamic(() => import('@/components/visualization/neural-net-visualization'), { ssr: false })

function ErrorFallback({ error }: FallbackProps) {
  return (
    <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
      <p className="font-bold">Something went wrong:</p>
      <pre className="mt-2">{error.message}</pre>
    </div>
  )
}

export default function MainPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <main className="relative h-screen w-full bg-black">
        <TutorialPopupComponent />
        <ImprovedButtonControlledSidebarMenu>
          <LayerControlCard />
          <LayerInfoCard />
        </ImprovedButtonControlledSidebarMenu>
        <NeuralNetVisualization>
          <div className='absolute top-5 left-5 flex flex-col'>
            <ControllPanel />
            <InferencePanel />
          </div>
        </NeuralNetVisualization>
        <div className="fixed bottom-4 left-4 z-50 flex items-center">
          <GitHubLink repoUrl="https://github.com/cleanupDev/nn_visualization" />
          <div className="w-5"></div>
          <FeedbackButtonComponent />
          <div className="w-5"></div>
          <TutorialButton />
        </div>
      </main>
    </ErrorBoundary>
  )
}