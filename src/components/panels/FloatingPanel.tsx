'use client'

import { useState, useRef, useCallback, ReactNode } from 'react'
import clsx from 'clsx'

interface FloatingPanelProps {
  title: string
  children: ReactNode
  defaultPosition?: { x: number; y: number }
  className?: string
}

export function FloatingPanel({
  title,
  children,
  defaultPosition = { x: 20, y: 20 },
  className,
}: FloatingPanelProps) {
  const [position, setPosition] = useState(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, input, [role="slider"]')) return

      setIsDragging(true)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      }

      const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - dragStartRef.current.x
        const dy = e.clientY - dragStartRef.current.y
        setPosition({
          x: dragStartRef.current.posX + dx,
          y: dragStartRef.current.posY + dy,
        })
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [position]
  )

  return (
    <div
      className={clsx(
        'absolute bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden select-none',
        isDragging && 'cursor-grabbing',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        zIndex: isDragging ? 100 : 10,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 border-b border-neutral-100 cursor-grab"
        onMouseDown={handleMouseDown}
      >
        <span className="text-sm font-medium text-neutral-700">{title}</span>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-200 transition-colors text-neutral-500"
        >
          {isMinimized ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Content */}
      {!isMinimized && <div className="p-4">{children}</div>}
    </div>
  )
}
