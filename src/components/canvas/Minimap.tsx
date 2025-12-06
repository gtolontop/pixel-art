'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useCanvasStore } from '@/lib/store'

const MINIMAP_SIZE = 150

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  const pixels = useCanvasStore((state) => state.pixels)
  const viewport = useCanvasStore((state) => state.viewport)
  const setViewport = useCanvasStore((state) => state.setViewport)

  // Calculate bounds of all pixels
  const getBounds = useCallback(() => {
    if (pixels.size === 0) {
      return { minX: -50, maxX: 50, minY: -50, maxY: 50 }
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    pixels.forEach((_, key) => {
      const [x, y] = key.split(',').map(Number)
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    })

    // Add padding
    const padding = Math.max(20, Math.max(maxX - minX, maxY - minY) * 0.1)
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
    }
  }, [pixels])

  // Convert minimap coordinates to world coordinates
  const minimapToWorld = useCallback(
    (mx: number, my: number) => {
      const bounds = getBounds()
      const worldWidth = bounds.maxX - bounds.minX
      const worldHeight = bounds.maxY - bounds.minY
      const scale = Math.min(MINIMAP_SIZE / worldWidth, MINIMAP_SIZE / worldHeight)

      const offsetX = (MINIMAP_SIZE - worldWidth * scale) / 2
      const offsetY = (MINIMAP_SIZE - worldHeight * scale) / 2

      const worldX = bounds.minX + (mx - offsetX) / scale
      const worldY = bounds.minY + (my - offsetY) / scale

      return { x: worldX, y: worldY }
    },
    [getBounds]
  )

  // Render minimap
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const bounds = getBounds()
    const worldWidth = bounds.maxX - bounds.minX
    const worldHeight = bounds.maxY - bounds.minY
    const scale = Math.min(MINIMAP_SIZE / worldWidth, MINIMAP_SIZE / worldHeight)

    // Clear
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE)

    // Calculate offset to center the content
    const offsetX = (MINIMAP_SIZE - worldWidth * scale) / 2
    const offsetY = (MINIMAP_SIZE - worldHeight * scale) / 2

    // Draw pixels
    pixels.forEach((color, key) => {
      const [x, y] = key.split(',').map(Number)
      const px = offsetX + (x - bounds.minX) * scale
      const py = offsetY + (y - bounds.minY) * scale

      ctx.fillStyle = color
      ctx.fillRect(px, py, Math.max(1, scale), Math.max(1, scale))
    })

    // Draw viewport rectangle
    const viewportWidth = window.innerWidth / viewport.zoom
    const viewportHeight = window.innerHeight / viewport.zoom

    const vpX = offsetX + (viewport.x - viewportWidth / 2 - bounds.minX) * scale
    const vpY = offsetY + (viewport.y - viewportHeight / 2 - bounds.minY) * scale
    const vpW = viewportWidth * scale
    const vpH = viewportHeight * scale

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(vpX, vpY, vpW, vpH)

    // Fill viewport with semi-transparent white
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(vpX, vpY, vpW, vpH)

    // Draw origin marker
    const originX = offsetX + (0 - bounds.minX) * scale
    const originY = offsetY + (0 - bounds.minY) * scale
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.arc(originX, originY, 3, 0, Math.PI * 2)
    ctx.fill()
  }, [pixels, viewport, getBounds])

  // Render on changes
  useEffect(() => {
    render()
  }, [render])

  // Handle click/drag to navigate
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const world = minimapToWorld(mx, my)

      setViewport({ x: world.x, y: world.y })
      setIsDragging(true)
    },
    [minimapToWorld, setViewport]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const world = minimapToWorld(mx, my)

      setViewport({ x: world.x, y: world.y })
    },
    [isDragging, minimapToWorld, setViewport]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-30 hidden md:block">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-2 -left-2 w-6 h-6 bg-neutral-800 text-white rounded-full flex items-center justify-center text-xs z-10 hover:bg-neutral-700 transition-colors"
        title={isExpanded ? 'Hide minimap' : 'Show minimap'}
      >
        {isExpanded ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
      </button>

      {/* Minimap canvas */}
      {isExpanded && (
        <div className="bg-neutral-900 rounded-lg shadow-xl border border-neutral-700 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={MINIMAP_SIZE}
            height={MINIMAP_SIZE}
            className="cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
          {/* Info */}
          <div className="px-2 py-1 bg-neutral-800 text-[10px] text-neutral-400 flex justify-between">
            <span>{pixels.size} px</span>
            <span>{Math.round(viewport.x)}, {Math.round(viewport.y)}</span>
          </div>
        </div>
      )}

      {/* Collapsed state */}
      {!isExpanded && (
        <div
          className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-neutral-700 transition-colors"
          onClick={() => setIsExpanded(true)}
        >
          <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
      )}
    </div>
  )
}
