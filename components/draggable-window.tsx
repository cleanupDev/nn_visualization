"use client"

import { useState, useCallback, MouseEvent, WheelEvent, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import 'katex/dist/katex.min.css'
import Latex from 'react-latex-next'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import 'react-resizable/css/styles.css'
import { X, Minimize, ChevronsDown } from 'lucide-react'
import { useModelStore } from './store'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface DraggableWindowProps {
  children: React.ReactNode
  onClose: () => void
  title?: string
  latexContent?: string
  graphData?: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      tension?: number
    }[]
  }
  graphTitle?: string
  customGraphOptions?: any
  initialPosition?: { x: number, y: number }
  zIndex?: number
}

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #18181b; /* zinc-900 */
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #27272a; /* zinc-800 */
    border-radius: 4px;
    transition: background 0.3s ease;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #3f3f46; /* zinc-700 */
  }
`;

function ScrollbarStyles() {
  return <style jsx global>{scrollbarStyles}</style>;
}

export function DraggableWindowComponent({ 
  children, 
  onClose, 
  title = "Resizable Draggable Window",
  latexContent, 
  graphData,
  graphTitle = "Data Over Time",
  customGraphOptions,
  initialPosition = { x: 50, y: 50 },
  zIndex = 50
}: DraggableWindowProps) {
  // Get the animation speed from the model store to sync with training updates
  const animationSpeed = useModelStore(state => state.animationSpeed)
  
  const windowRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)
  
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [position, setPosition] = useState(initialPosition)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: 384, height: 320 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isMinimized, setIsMinimized] = useState(false)
  
  // Handle dragging
  const handleHeaderMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    
    // Add a class to prevent text selection during drag
    document.body.classList.add('dragging-window')
  }, [position])
  
  // Handle resizing
  const handleResizeMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isMinimized) return
    
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    })
    
    document.body.classList.add('resizing-window')
  }, [size, isMinimized])

  // Handle mouse movement for both dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      // Handle dragging - with ZERO restrictions
      if (isDragging) {
        e.preventDefault()
        // Simply calculate new position with no bounds checking whatsoever
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        })
      }
      
      // Handle resizing with minimal constraints
      if (isResizing) {
        e.preventDefault()
        
        // Calculate new width and height
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        
        // Enforce only a minimum size, no maximum
        const newWidth = Math.max(200, resizeStart.width + deltaX)
        const newHeight = Math.max(200, resizeStart.height + deltaY)
        
        setSize({
          width: newWidth,
          height: newHeight
        })
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      document.body.classList.remove('dragging-window', 'resizing-window')
    }
    
    if (isDragging || isResizing) {
      // Add global event listeners when dragging or resizing
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      // Clean up
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, resizeStart])

  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    if (contentRef.current) {
      contentRef.current.scrollTop += e.deltaY
    }
  }, [])
  
  const toggleMinimize = useCallback(() => {
    if (isMinimized) {
      // Restore previous size when unminimizing
      setIsMinimized(false)
    } else {
      // Save current size and minimize
      setIsMinimized(true)
    }
  }, [isMinimized])

  // Enhanced graph options with theme support and dynamic animation duration
  const graphOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      // Set the animation duration based on the animation speed
      // Faster speeds need quicker animations to keep up with updates
      // Slower animation (higher duration) for slow speeds, faster animation for high speeds
      duration: animationSpeed ? Math.max(50, 300 - (animationSpeed * 10)) : 200 
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#d4d4d8', // zinc-300
          boxWidth: 12,
          padding: 8,
          font: { size: 10, family: 'monospace' }
        }
      },
      title: {
        display: true,
        text: graphTitle,
        color: '#d4d4d8', // zinc-300
        font: { size: 14, weight: 'bold', family: 'monospace' }
      },
      tooltip: {
        bodyFont: { size: 11, family: 'monospace' },
        titleFont: { size: 12, family: 'monospace' },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 8,
        cornerRadius: 4,
        boxPadding: 4
      }
    },
    scales: {
      x: {
        ticks: { color: '#d4d4d8', maxRotation: 0, font: { family: 'monospace', size: 9 } },
        grid: { color: 'rgba(39, 39, 42, 0.5)' }, // zinc-800 with opacity
      },
      y: {
        ticks: { color: '#d4d4d8', font: { family: 'monospace', size: 9 } },
        grid: { color: 'rgba(39, 39, 42, 0.5)' }, // zinc-800 with opacity
      },
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 4
      },
      line: {
        tension: 0.2
      }
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events when window is focused
      if (!windowRef.current?.contains(document.activeElement)) return
      
      // Close on Escape
      if (e.key === 'Escape') {
        onClose()
      }
      
      // Toggle minimize on 'N'
      if (e.key === 'n') {
        toggleMinimize()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, toggleMinimize])

  return (
    <AnimatePresence>
      <motion.div
        ref={windowRef}
        className="fixed"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: isMinimized ? 'auto' : size.height,
          zIndex
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Include the scrollbar styles */}
        <ScrollbarStyles />
        
        <div
          className={`flex flex-col rounded-md border border-zinc-800 bg-black/90 backdrop-blur-sm shadow-lg overflow-hidden ${isDragging ? 'cursor-grabbing' : ''} ${isResizing ? 'cursor-se-resize' : ''}`}
          style={{
            width: '100%',
            height: '100%',
            transition: isMinimized && !isDragging && !isResizing ? 'height 0.2s, width 0.2s' : 'none',
          }}
        >
          {/* Window Header */}
          <div
            ref={headerRef}
            className="bg-zinc-900 border-b border-zinc-800 p-2 flex justify-between items-center select-none cursor-grab"
            onMouseDown={handleHeaderMouseDown}
          >
            <span className="font-mono text-sm font-medium text-zinc-300 truncate">{title}</span>
            <div className="flex space-x-1">
              <button 
                onClick={toggleMinimize} 
                className="text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-300 rounded p-0.5 h-6 w-6 flex items-center justify-center"
                title={isMinimized ? "Restore" : "Minimize"}
              >
                {isMinimized ? <ChevronsDown size={14} /> : <Minimize size={14} />}
              </button>
              
              <button 
                onClick={onClose} 
                className="text-zinc-400 hover:bg-red-900/80 hover:text-red-300 rounded p-0.5 h-6 w-6 flex items-center justify-center"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          
          {/* Window Content - only render if not minimized */}
          {!isMinimized && (
            <div
              ref={contentRef}
              className="p-4 text-zinc-300 overflow-auto flex-grow font-mono text-sm bg-zinc-900/30 custom-scrollbar"
              onWheel={handleWheel}
            >
              {children}
              
              {graphData && (
                <div className="mt-4 p-3 bg-black/50 rounded-md border border-zinc-800" style={{ height: graphData.datasets[0]?.data.length > 0 ? '220px' : 'auto' }}>
                  {graphData.datasets[0]?.data.length > 0 ? (
                    <Line options={customGraphOptions || graphOptions} data={graphData} />
                  ) : (
                    <div className="flex items-center justify-center h-32 text-zinc-500 font-mono text-xs">
                      NO DATA AVAILABLE
                    </div>
                  )}
                </div>
              )}
              
              {latexContent && (
                <div className="mt-4 p-3 bg-black/50 rounded-md border border-zinc-800 latex-container">
                  <Latex>{latexContent}</Latex>
                </div>
              )}
            </div>
          )}
          
          {/* Resize handle - not shown when minimized */}
          {!isMinimized && (
            <div
              ref={resizerRef}
              className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
              onMouseDown={handleResizeMouseDown}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                className="absolute bottom-1 right-1"
                fill="#3f3f46" /* zinc-700 */
              >
                <path d="M0 10L10 10L10 0Z" />
              </svg>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
} 