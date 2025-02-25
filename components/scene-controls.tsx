"use client"
import { Camera, Maximize, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useModelStore } from '@/components/store'

interface SceneControlsProps {
  isSidebarOpen: boolean
}

export function SceneControls({ isSidebarOpen }: SceneControlsProps) {
  const { setCameraType } = useModelStore()

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