"use client"

import { Button } from "@/components/ui/button"
import { openTutorial } from "@/components/tutorial-popup"
import Image from "next/image"

export function TutorialButton() {
  return (
    <Button
      variant="outline"
      size="icon"
      className="w-6 h-6 p-0 rounded-full flex items-center justify-center"
      style={{
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      }}
      onClick={() => openTutorial()}
      title="Open Tutorial"
    >
      <div className="flex items-center justify-center">
        <Image
          src="/tutorial-icon.svg"
          alt="Tutorial"
          width={24}
          height={24}
          className="opacity-70 hover:opacity-100 transition-opacity"
        />
      </div>
      <span className="sr-only">Open tutorial</span>
    </Button>
  )
} 