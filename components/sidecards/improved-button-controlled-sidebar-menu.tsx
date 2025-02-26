'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { Button } from "@/components/ui/button"
import DatasetSelectionCard from './DatasetSelectionCard'
import { cn } from '@/lib/utils'

interface SidebarMenuProps {
  children: ReactNode
}

export function ImprovedButtonControlledSidebarMenu({ children }: SidebarMenuProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isStylesLoaded, setIsStylesLoaded] = useState(false)

  const toggleMenu = useCallback(() => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    // Dispatch custom event that the visualization component can listen for
    const event = new CustomEvent('sidebar-toggle', { 
      detail: { isOpen: newState } 
    });
    window.dispatchEvent(event);
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        toggleMenu();
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, toggleMenu])

  useEffect(() => {
    // Delay setting isStylesLoaded to ensure styles are applied
    const timer = setTimeout(() => setIsStylesLoaded(true), 50)
    
    // Dispatch initial sidebar state
    const event = new CustomEvent('sidebar-toggle', { 
      detail: { isOpen: true } 
    });
    window.dispatchEvent(event);
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Menu toggle button */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "fixed right-4 top-4 z-50 h-8 w-8 shrink-0 rounded-full border border-zinc-800 bg-black/90 text-zinc-400 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm hover:bg-black hover:text-zinc-300",
          isOpen && "right-[352px]",
        )}
        onClick={toggleMenu}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 z-40 h-full w-[340px] transform border-l border-zinc-800 bg-black/90 backdrop-blur-sm transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 pt-16 h-full flex flex-col">
          <div className="flex items-center font-mono text-zinc-300 mb-4">
            <Menu className="mr-2 h-4 w-4" />
            NEURAL NETWORK CONTROLS
          </div>
          
          {/* Scrollable area for cards */}
          <div className={`flex-grow overflow-y-auto custom-scrollbar ${isStylesLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
            <div className="space-y-4 pr-2">
              <DatasetSelectionCard />
              {children}
            </div>
          </div>
        </div>
      </div>

      <ScrollbarStyles />
    </>
  )
}

function InfoCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 shadow">
      <h3 className="font-medium text-zinc-300 mb-2">{title}</h3>
      <p className="text-sm text-zinc-400">{content}</p>
    </div>
  )
}

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1a1a1a;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 4px;
    transition: background 0.3s ease;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #444;
  }
`;

function ScrollbarStyles() {
  return <style jsx global>{scrollbarStyles}</style>;
}