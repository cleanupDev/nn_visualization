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
    title: "Welcome to Our App!",
    description: "This tutorial will guide you through the main features of our application.",
    media: "/placeholder.svg",
    mediaType: "image"
  },
  {
    title: "Explore the Dashboard",
    description: "Our intuitive dashboard provides an overview of all your important information.",
    media: "/placeholder.mp4",
    mediaType: "video"
  },
  {
    title: "Quick Actions",
    description: "Use quick actions to perform common tasks with just a single click.",
    media: "/placeholder.gif",
    mediaType: "gif"
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
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                  src={tutorialSteps[currentStep].media}
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