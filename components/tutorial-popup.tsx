"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image";


interface TutorialStep {
  title: string
  description: string
  media?: string
  mediaType: "image" | "video" | "gif"
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Look-Inside-AI!",
    description: "This interactive tool allows you to visualize and understand how basic neural networks work. This tutorial will guide you through the main features.",
    media: "/placeholder.svg", // Replace with a relevant image later
    mediaType: "image"
  },
  {
    title: "Dataset Selection",
    description: "Start by selecting a dataset from the right-hand panel. Currently, you can choose between a XOR, a Sine, and the MNIST dataset. Support for CIFAR-10 and custom datasets is planned for future releases.",
    media: "/placeholder.svg", // Replace with a relevant image later
    mediaType: "image"
  },
  {
    title: "Model Configuration",
    description: "In the right-hand panel, you can configure the architecture of your neural network. Add layers and adjust the number of neurons. In the future, you will also be able to select activation functions, different kinds of layers, and more.",
    media: "/placeholder.svg", // Replace with a relevant image later
    mediaType: "image"
  },
  {
    title: "Training Visualization",
    description: "Once you've set up your model, start the training process via the controll panel on the top-left! You'll see the network learn in real-time, with visualizations of weights and biases.",
    media: "/placeholder.svg", // Replace with an image of the training visualization
    mediaType: "image"
  },
  {
    title: "Interactive Controls",
    description: "During training, you can pause, resume, or reset the process. In the future you will be able to also adjust the learning rate and other hyperparameters on the fly.",
    media: "/placeholder.svg", // Replace with a relevant image later
    mediaType: "image"
  },
  {
    title: "Detailed Neuron Information",
    description: "Click on any neuron in the visualization to open one or more detailed windows. This window provides highly detailed information about the selected neuron, including its activation function, weights, biases, and a graph of its activity.",
    media: "/placeholder.svg", // Add a relevant image later, perhaps a screenshot of the draggable window
    mediaType: "image"
  },
  {
    title: "Feedback",
    description: "I value your feedback! Use the feedback button to send me your thoughts and suggestions.",
    media: "/placeholder.svg", // Replace with a relevant image later
    mediaType: "image"
  }
]

export function TutorialPopupComponent() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    const shouldShowTutorial = localStorage.getItem("shouldShowTutorial")
    if (shouldShowTutorial !== "false") {
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    if (dontShowAgain) {
      localStorage.setItem("shouldShowTutorial", "false")
    }
  }

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleDontShowAgainChange = (checked: boolean) => {
    setDontShowAgain(checked)
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" aria-hidden="true" />
      )}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && dontShowAgain) {
            localStorage.setItem("shouldShowTutorial", "false");
          }
          setIsOpen(open);
        }}
      >
        <DialogContent className="w-[80vw] h-[80vh] bg-gray-800 text-white z-50">
          <DialogHeader>
            <DialogTitle>{tutorialSteps[currentStep].title}</DialogTitle>
            <DialogDescription className="text-gray-300">
              {tutorialSteps[currentStep].description}
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            {tutorialSteps[currentStep].media && (
              tutorialSteps[currentStep].mediaType === "video" ? (
                <video
                  src={tutorialSteps[currentStep].media}
                  className="w-full h-full rounded-md"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={tutorialSteps[currentStep].media || "/default-placeholder.svg"}
                  alt={tutorialSteps[currentStep].title}
                  className="w-full h-full rounded-md"
                  width={300}
                  height={200}
                />
              )
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain}
              onCheckedChange={handleDontShowAgainChange}
            />
            <Label
              htmlFor="dontShowAgain"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Don&apos;t show again
            </Label>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button onClick={handleNext} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}