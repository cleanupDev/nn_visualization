'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface SidebarMenuProps {
  children: ReactNode
}

export function ImprovedButtonControlledSidebarMenu({ children }: SidebarMenuProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isStylesLoaded, setIsStylesLoaded] = useState(false)

  const toggleMenu = useCallback(() => {
    setIsOpen(prevState => !prevState)
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  useEffect(() => {
    // Delay setting isStylesLoaded to ensure styles are applied
    const timer = setTimeout(() => setIsStylesLoaded(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Menu toggle button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 bg-[#28242c] border-none hover:bg-[#3a3540]"
        onClick={toggleMenu}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <Menu size={24} className="text-[#e0e0e0]" />
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-4 right-4 w-80 bg-[#28242c] rounded-lg shadow-lg transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+16px)]'
        }`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Menu</h2>
          </div>
          
          {/* Scrollable area for cards */}
          <div className={`flex-grow overflow-y-auto custom-scrollbar ${isStylesLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
            <div className="space-y-4 pr-4">
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
    <div className="bg-card text-card-foreground rounded-lg p-4 shadow">
      <h3 className="font-medium mb-2">{title}</h3>
      <p className="text-sm">{content}</p>
    </div>
  )
}

const scrollbarStyles = `
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #3a3540;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4a4550;
    border-radius: 4px;
    transition: background 0.3s ease;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #5a5560;
  }
`;

function ScrollbarStyles() {
  return <style jsx global>{scrollbarStyles}</style>;
}