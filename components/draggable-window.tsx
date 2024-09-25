"use client"

import { useState, useCallback, MouseEvent } from 'react'
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

  const handleMouseDown = useCallback((e: MouseEvent) => {
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

  const graphOptions = {
    responsive: true,
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
    <div
      className="rounded-lg shadow-lg border border-[#1971c2] w-96"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: '-150px',
        marginLeft: '-192px',
        backgroundColor: '#121212',
        color: '#e0e0e0',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="bg-[#1971c2] p-2 rounded-t-lg mb-2 flex justify-between items-center">
        <span className="font-bold text-[#121212]">Draggable Window</span>
        <button onClick={onClose} className="text-[#121212] hover:text-[#e03131]">
          ×
        </button>
      </div>
      <div className="p-4 text-[#e0e0e0]">
        {children}
        {latexContent && (
          <div className="mt-4">
            <Latex>{latexContent}</Latex>
          </div>
        )}
        {graphData && (
          <div className="mt-4">
            <Line options={graphOptions} data={graphData} />
          </div>
        )}
      </div>
    </div>
  )
}