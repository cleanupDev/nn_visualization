"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import Image from "next/image";

// Singleton pattern to share tutorial state across components
let globalSetIsOpen: ((isOpen: boolean) => void) | null = null;

interface TutorialStep {
  title: string
  description: string
  media?: string
  mediaType: "image" | "video" | "gif"
}

// Function to open tutorial from outside components
export function openTutorial() {
  if (globalSetIsOpen) {
    globalSetIsOpen(true);
  }
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to LookInsideAI!",
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

  // Store the setter function in the global variable
  useEffect(() => {
    globalSetIsOpen = setIsOpen;
    return () => {
      globalSetIsOpen = null;
    };
  }, []);

  useEffect(() => {
    // Debug log to check current value (comment out in production)
    console.log("Current shouldShowTutorial value:", localStorage.getItem("shouldShowTutorial"));
    
    const shouldShowTutorial = localStorage.getItem("shouldShowTutorial")
    if (shouldShowTutorial !== "false") {
      console.log("Opening tutorial popup");
      setIsOpen(true)
    }
  }, [])

  // Function to reset tutorial state for testing
  const resetTutorialState = () => {
    localStorage.removeItem("shouldShowTutorial");
    window.location.reload();
  }

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" aria-hidden="true" />
      )}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Save preference when dialog is closed by any means
            if (dontShowAgain) {
              localStorage.setItem("shouldShowTutorial", "false");
            }
          }
          setIsOpen(open);
        }}
      >
        <DialogContent className="w-[70vw] max-w-3xl h-auto max-h-[700px] bg-black border border-zinc-800 text-white z-50 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-cyan-400">{tutorialSteps[currentStep].title}</DialogTitle>
            <DialogDescription className="text-zinc-300 mt-2">
              {tutorialSteps[currentStep].description}
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 flex-grow flex items-center justify-center">
            {tutorialSteps[currentStep].media && (
              tutorialSteps[currentStep].mediaType === "video" ? (
                <video
                  src={tutorialSteps[currentStep].media}
                  className="w-full h-auto max-h-[40vh] rounded-md border border-zinc-700"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={tutorialSteps[currentStep].media || "/default-placeholder.svg"}
                  alt={tutorialSteps[currentStep].title}
                  className="w-auto h-auto max-h-[40vh] rounded-md border border-zinc-700"
                  width={400}
                  height={250}
                />
              )
            )}
          </div>
          <div className="flex items-center space-x-2 mt-2 mb-4">
            <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain}
              onCheckedChange={handleDontShowAgainChange}
              className="border-zinc-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
            />
            <Label
              htmlFor="dontShowAgain"
              className="text-sm font-medium text-zinc-300"
            >
              Don&apos;t show again
            </Label>
          </div>
          <div className="flex justify-between pt-4 border-t border-zinc-800 mt-auto">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="bg-zinc-900 text-white border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-all"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button 
              onClick={handleNext} 
              className="bg-cyan-600 text-white hover:bg-cyan-500 transition-all"
            >
              {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}