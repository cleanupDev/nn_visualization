"use client"
import { Camera, Maximize, RotateCcw, HelpCircle, MousePointer } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useModelStore } from '@/components/store'

interface SceneControlsProps {
  isSidebarOpen: boolean
}

export function SceneControls({ isSidebarOpen }: SceneControlsProps) {
  const { setCameraType } = useModelStore()
  const [showMouseControls, setShowMouseControls] = useState(false)

  const handleResetView = () => {
    // Reset camera position
    const resetEvent = new CustomEvent('reset-camera')
    window.dispatchEvent(resetEvent)
  }

  const handleSetCameraMode = (mode: "perspective" | "orthographic") => {
    setCameraType(mode)
  }

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "absolute bottom-4 z-10 flex items-center transition-all duration-300",
          isSidebarOpen ? "right-[calc(336px+16px)]" : "right-4",
        )}
      >
        <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-black/90 p-1 backdrop-blur-sm">
          {/* Mouse Controls - only opens when clicked */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-sm p-0 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
              onClick={() => setShowMouseControls(!showMouseControls)}
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            
            {showMouseControls && (
              <div className="absolute bottom-full right-0 mb-2 rounded-md border border-zinc-800 bg-zinc-950 p-3 shadow-md w-52">
                <div className="space-y-2">
                  <p className="font-semibold text-zinc-200">Mouse Controls:</p>
                  <ul className="text-xs space-y-1 text-zinc-300">
                    <li>• <span className="font-medium">Left Button:</span> Rotate the view</li>
                    <li>• <span className="font-medium">Right Button:</span> Pan the view</li>
                    <li>• <span className="font-medium">Left + Scroll:</span> Zoom in/out</li>
                    <li>• <span className="font-medium">Middle Button:</span> Also zooms</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetView}
                className="h-6 w-6 rounded-sm p-0 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Reset View</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-sm p-0 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-32 border-zinc-800 bg-black/90 text-zinc-400 backdrop-blur-sm"
            >
              <DropdownMenuItem onClick={() => handleSetCameraMode("perspective")}>Perspective</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetCameraMode("orthographic")}>Orthographic</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFullscreen}
                className="h-6 w-6 rounded-sm p-0 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Toggle Fullscreen</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
} 