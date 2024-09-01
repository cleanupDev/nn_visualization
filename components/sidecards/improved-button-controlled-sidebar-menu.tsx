'use client'

import { useState, useEffect, useCallback } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from "@/components/ui/button"

export function ImprovedButtonControlledSidebarMenu() {
  const [isOpen, setIsOpen] = useState(false)

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

  return (
    <>
      {/* Menu toggle button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50"
        onClick={toggleMenu}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <Menu size={24} />
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-4 right-4 w-80 bg-background border border-border rounded-lg shadow-lg transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+16px)]'
        }`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Retract menu"
            >
              <X size={20} />
            </Button>
          </div>
          
          {/* Info Cards */}
          <div className="space-y-4">
            <InfoCard title="Card 1" content="This is the content for card 1." />
            <InfoCard title="Card 2" content="This is the content for card 2." />
            <InfoCard title="Card 3" content="This is the content for card 3." />
          </div>
        </div>
      </div>
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