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
import { X, Minimize, Maximize, ChevronsDown } from 'lucide-react'

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
  const [isMaximized, setIsMaximized] = useState(false)
  const [previousSize, setPreviousSize] = useState({ width: 384, height: 320 })
  const [previousPosition, setPreviousPosition] = useState(initialPosition)
  
  // Update window bounds on mount and resize
  useEffect(() => {
    const handleWindowResize = () => {
      // If maximized, update size to match window
      if (isMaximized) {
        setSize({ width: window.innerWidth - 40, height: window.innerHeight - 80 })
      }
    }
    
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [isMaximized])

  // Handle dragging
  const handleHeaderMouseDown = useCallback((e: MouseEvent) => {
    if (isMaximized) return
    
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    
    // Add a class to prevent text selection during drag
    document.body.classList.add('dragging-window')
  }, [position, isMaximized])
  
  // Handle resizing
  const handleResizeMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isMaximized || isMinimized) return
    
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    })
    
    document.body.classList.add('resizing-window')
  }, [size, isMaximized, isMinimized])

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
      setPreviousSize(size)
      setIsMinimized(true)
    }
  }, [isMinimized, size])
  
  const toggleMaximize = useCallback(() => {
    if (isMaximized) {
      // Restore previous size and position
      setSize(previousSize)
      setPosition(previousPosition)
      setIsMaximized(false)
    } else {
      // Save current size and position, then maximize
      setPreviousSize(size)
      setPreviousPosition(position)
      setSize({ width: window.innerWidth - 40, height: window.innerHeight - 80 })
      setPosition({ x: 20, y: 40 })
      setIsMaximized(true)
    }
  }, [isMaximized, position, size, previousPosition, previousSize])

  // Enhanced graph options with theme support
  const graphOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 200 
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e0e0e0',
          boxWidth: 12,
          padding: 8,
          font: { size: 10 }
        }
      },
      title: {
        display: true,
        text: graphTitle,
        color: '#e0e0e0',
        font: { size: 14, weight: 'bold' }
      },
      tooltip: {
        bodyFont: { size: 11 },
        titleFont: { size: 12 },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 8,
        cornerRadius: 4,
        boxPadding: 4
      }
    },
    scales: {
      x: {
        ticks: { color: '#e0e0e0', maxRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        ticks: { color: '#e0e0e0' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
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
      
      // Toggle maximize on 'M'
      if (e.key === 'm') {
        toggleMaximize()
      }
      
      // Toggle minimize on 'N'
      if (e.key === 'n') {
        toggleMinimize()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, toggleMaximize, toggleMinimize])

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
        <div
          className={`flex flex-col rounded-lg border border-[#1971c2] bg-gray-900 shadow-lg overflow-hidden ${isDragging ? 'cursor-grabbing' : ''} ${isResizing ? 'cursor-se-resize' : ''}`}
          style={{
            width: '100%',
            height: '100%',
            transition: (isMinimized || isMaximized) && !(isDragging || isResizing) ? 'height 0.2s, width 0.2s' : 'none',
          }}
        >
          {/* Window Header */}
          <div
            ref={headerRef}
            className={`bg-[#1971c2] p-2 flex justify-between items-center select-none ${isMaximized ? '' : 'cursor-grab'}`}
            onMouseDown={handleHeaderMouseDown}
            onDoubleClick={toggleMaximize}
          >
            <span className="font-semibold text-white truncate">{title}</span>
            <div className="flex space-x-1">
              <button 
                onClick={toggleMinimize} 
                className="text-white hover:bg-blue-600 rounded p-0.5"
                title={isMinimized ? "Restore" : "Minimize"}
              >
                {isMinimized ? <ChevronsDown size={14} /> : <Minimize size={14} />}
              </button>
              
              <button 
                onClick={toggleMaximize} 
                className="text-white hover:bg-blue-600 rounded p-0.5"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                <Maximize size={14} />
              </button>
              
              <button 
                onClick={onClose} 
                className="text-white hover:bg-red-600 rounded p-0.5"
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
              className="p-4 text-[#e0e0e0] overflow-auto flex-grow"
              onWheel={handleWheel}
            >
              {children}
              
              {graphData && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700" style={{ height: graphData.datasets[0]?.data.length > 0 ? '220px' : 'auto' }}>
                  {graphData.datasets[0]?.data.length > 0 ? (
                    <Line options={customGraphOptions || graphOptions} data={graphData} />
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      No data available yet
                    </div>
                  )}
                </div>
              )}
              
              {latexContent && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700 latex-container">
                  <Latex>{latexContent}</Latex>
                </div>
              )}
            </div>
          )}
          
          {/* Resize handle - not shown when minimized or maximized */}
          {!isMinimized && !isMaximized && (
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
                fill="#1971c2"
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