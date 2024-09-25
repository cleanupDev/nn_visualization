"use client"

import { useState, useCallback, MouseEvent, WheelEvent, useRef } from 'react'
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
import { Resizable, ResizeCallbackData } from 'react-resizable'
import 'react-resizable/css/styles.css'

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
  latexContent?: string
  graphData?: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }[]
  }
}

export function DraggableWindowComponent({ children, onClose, latexContent, graphData }: DraggableWindowProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: 384, height: 300 })
  const contentRef = useRef<HTMLDivElement>(null)

  const handleHeaderMouseDown = useCallback((e: MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }, [position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleResize = useCallback((e: React.SyntheticEvent, data: ResizeCallbackData) => {
    setSize({ width: data.size.width, height: data.size.height })
  }, [])

  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    if (contentRef.current) {
      contentRef.current.scrollTop += e.deltaY
    }
  }, [])

  const graphOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sample Graph',
      },
    },
    scales: {
      x: {
        ticks: { color: '#1e1e1e' },
        grid: { color: '#1e1e1e' },
      },
      y: {
        ticks: { color: '#1e1e1e' },
        grid: { color: '#1e1e1e' },
      },
    },
  }

  return (
    <Resizable
      width={size.width}
      height={size.height}
      onResize={handleResize}
      minConstraints={[200, 200]}
      maxConstraints={[800, 600]}
    >
      <div
        className="rounded-lg shadow-lg border border-[#1971c2]"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `translate(${position.x}px, ${position.y}px)`,
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: '-150px',
          marginLeft: '-192px',
          backgroundColor: '#121212',
          color: '#e0e0e0',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="bg-[#1971c2] p-2 rounded-t-lg flex justify-between items-center cursor-move"
          onMouseDown={handleHeaderMouseDown}
        >
          <span className="font-bold text-[#121212]">Resizable Draggable Window</span>
          <button onClick={onClose} className="text-[#121212] hover:text-[#e03131]">
            ×
          </button>
        </div>
        <div
          ref={contentRef}
          className="p-4 text-[#e0e0e0] overflow-auto flex-grow"
          onWheel={handleWheel}
        >
          {children}
          {latexContent && (
            <div className="mt-4">
              <Latex>{latexContent}</Latex>
            </div>
          )}
          {graphData && (
            <div className="mt-4" style={{ height: '200px' }}>
              <Line options={graphOptions} data={graphData} />
            </div>
          )}
        </div>
      </div>
    </Resizable>
  )
}