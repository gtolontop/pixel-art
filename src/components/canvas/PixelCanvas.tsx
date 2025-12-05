'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCanvasStore } from '@/lib/store'
import { MIN_ZOOM, MAX_ZOOM, DEFAULT_ZOOM } from '@/types'

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const lastPixelRef = useRef<{ x: number; y: number } | null>(null)
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasInitializedFromUrl = useRef(false)

  const searchParams = useSearchParams()
  const router = useRouter()

  const viewport = useCanvasStore((state) => state.viewport)
  const setViewport = useCanvasStore((state) => state.setViewport)
  const pixels = useCanvasStore((state) => state.pixels)
  const setPixel = useCanvasStore((state) => state.setPixel)
  const getPixel = useCanvasStore((state) => state.getPixel)
  const currentColor = useCanvasStore((state) => state.currentColor)
  const currentTool = useCanvasStore((state) => state.currentTool)
  const brushSize = useCanvasStore((state) => state.brushSize)
  const setColor = useCanvasStore((state) => state.setColor)
  const addRecentColor = useCanvasStore((state) => state.addRecentColor)
  const addPendingPixel = useCanvasStore((state) => state.addPendingPixel)

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const worldX = Math.floor((screenX - centerX) / viewport.zoom + viewport.x)
      const worldY = Math.floor((screenY - centerY) / viewport.zoom + viewport.y)

      return { x: worldX, y: worldY }
    },
    [viewport]
  )

  // Draw a single pixel or brush stroke
  const drawPixel = useCallback(
    (worldX: number, worldY: number) => {
      const halfSize = Math.floor(brushSize / 2)

      for (let dx = -halfSize; dx < brushSize - halfSize; dx++) {
        for (let dy = -halfSize; dy < brushSize - halfSize; dy++) {
          const px = worldX + dx
          const py = worldY + dy

          if (currentTool === 'brush') {
            setPixel(px, py, currentColor)
            addPendingPixel({ x: px, y: py, color: currentColor })
          } else if (currentTool === 'eraser') {
            setPixel(px, py, '')
            addPendingPixel({ x: px, y: py, color: '' })
          }
        }
      }
    },
    [brushSize, currentColor, currentTool, setPixel, addPendingPixel]
  )

  // Handle eyedropper
  const pickColor = useCallback(
    (worldX: number, worldY: number) => {
      const color = getPixel(worldX, worldY)
      if (color) {
        setColor(color)
        addRecentColor(color)
      }
    },
    [getPixel, setColor, addRecentColor]
  )

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const width = canvas.width
    const height = canvas.height
    const { x: viewX, y: viewY, zoom } = viewport

    // Clear
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, width, height)

    const centerX = width / 2
    const centerY = height / 2

    // Calculate visible range
    const halfWidth = width / 2 / zoom
    const halfHeight = height / 2 / zoom
    const minX = Math.floor(viewX - halfWidth) - 1
    const maxX = Math.ceil(viewX + halfWidth) + 1
    const minY = Math.floor(viewY - halfHeight) - 1
    const maxY = Math.ceil(viewY + halfHeight) + 1

    // Draw grid (only if zoomed in enough)
    if (zoom >= 4) {
      ctx.strokeStyle = '#e0e0e0'
      ctx.lineWidth = 1

      for (let x = minX; x <= maxX; x++) {
        const screenX = centerX + (x - viewX) * zoom
        ctx.beginPath()
        ctx.moveTo(screenX, 0)
        ctx.lineTo(screenX, height)
        ctx.stroke()
      }

      for (let y = minY; y <= maxY; y++) {
        const screenY = centerY + (y - viewY) * zoom
        ctx.beginPath()
        ctx.moveTo(0, screenY)
        ctx.lineTo(width, screenY)
        ctx.stroke()
      }
    }

    // Draw pixels
    pixels.forEach((color, key) => {
      const [x, y] = key.split(',').map(Number)

      // Skip if outside visible range
      if (x < minX || x > maxX || y < minY || y > maxY) return

      const screenX = centerX + (x - viewX) * zoom
      const screenY = centerY + (y - viewY) * zoom

      ctx.fillStyle = color
      ctx.fillRect(screenX, screenY, zoom, zoom)
    })

    // Draw origin marker
    if (zoom >= 2) {
      const originX = centerX - viewX * zoom
      const originY = centerY - viewY * zoom
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.beginPath()
      ctx.arc(originX, originY, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [viewport, pixels])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      render()
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [render])

  // Render on state change
  useEffect(() => {
    render()
  }, [render])

  // Initialize viewport from URL parameters
  useEffect(() => {
    if (hasInitializedFromUrl.current) return
    hasInitializedFromUrl.current = true

    const xParam = searchParams.get('x')
    const yParam = searchParams.get('y')
    const zParam = searchParams.get('z')

    if (xParam || yParam || zParam) {
      setViewport({
        x: xParam ? parseFloat(xParam) : 0,
        y: yParam ? parseFloat(yParam) : 0,
        zoom: zParam ? parseFloat(zParam) : DEFAULT_ZOOM,
      })
    }
  }, [searchParams, setViewport])

  // Update URL when viewport changes (debounced)
  useEffect(() => {
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current)
    }

    urlUpdateTimeoutRef.current = setTimeout(() => {
      const x = Math.round(viewport.x)
      const y = Math.round(viewport.y)
      const z = Math.round(viewport.zoom * 10) / 10

      const newUrl = `?x=${x}&y=${y}&z=${z}`
      window.history.replaceState(null, '', newUrl)
    }, 300) // Debounce 300ms

    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current)
      }
    }
  }, [viewport])

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      lastPosRef.current = { x: e.clientX, y: e.clientY }

      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        // Middle click or Alt+click = pan
        setIsDragging(true)
        e.preventDefault()
      } else if (e.button === 0) {
        // Left click = draw
        const world = screenToWorld(x, y)

        if (currentTool === 'eyedropper') {
          pickColor(world.x, world.y)
        } else {
          setIsDrawing(true)
          lastPixelRef.current = world
          drawPixel(world.x, world.y)
        }
      }
    },
    [screenToWorld, currentTool, pickColor, drawPixel]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - lastPosRef.current.x
        const dy = e.clientY - lastPosRef.current.y
        lastPosRef.current = { x: e.clientX, y: e.clientY }

        setViewport({
          x: viewport.x - dx / viewport.zoom,
          y: viewport.y - dy / viewport.zoom,
        })
      } else if (isDrawing) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const world = screenToWorld(x, y)

        // Only draw if position changed
        if (!lastPixelRef.current || world.x !== lastPixelRef.current.x || world.y !== lastPixelRef.current.y) {
          lastPixelRef.current = world
          drawPixel(world.x, world.y)
        }
      }
    },
    [isDragging, isDrawing, viewport, setViewport, screenToWorld, drawPixel]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsDrawing(false)
    lastPixelRef.current = null
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Get world position under mouse before zoom
      const worldBefore = screenToWorld(mouseX, mouseY)

      // Calculate new zoom
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.zoom * zoomFactor))

      // Calculate new viewport to keep mouse position stable
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const newX = worldBefore.x - (mouseX - centerX) / newZoom
      const newY = worldBefore.y - (mouseY - centerY) / newZoom

      setViewport({ x: newX, y: newY, zoom: newZoom })
    },
    [viewport, setViewport, screenToWorld]
  )

  // Touch handlers for mobile
  const touchStartRef = useRef<{ x: number; y: number; dist: number } | null>(null)

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch = draw
        const touch = e.touches[0]
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = touch.clientX - rect.left
        const y = touch.clientY - rect.top
        const world = screenToWorld(x, y)

        if (currentTool === 'eyedropper') {
          pickColor(world.x, world.y)
        } else {
          setIsDrawing(true)
          lastPixelRef.current = world
          drawPixel(world.x, world.y)
        }

        lastPosRef.current = { x: touch.clientX, y: touch.clientY }
      } else if (e.touches.length === 2) {
        // Two fingers = pan/zoom
        setIsDrawing(false)
        const [t1, t2] = [e.touches[0], e.touches[1]]
        const centerX = (t1.clientX + t2.clientX) / 2
        const centerY = (t1.clientY + t2.clientY) / 2
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)

        touchStartRef.current = { x: centerX, y: centerY, dist }
        lastPosRef.current = { x: centerX, y: centerY }
      }
    },
    [screenToWorld, currentTool, pickColor, drawPixel]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      if (e.touches.length === 1 && isDrawing) {
        const touch = e.touches[0]
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = touch.clientX - rect.left
        const y = touch.clientY - rect.top
        const world = screenToWorld(x, y)

        if (!lastPixelRef.current || world.x !== lastPixelRef.current.x || world.y !== lastPixelRef.current.y) {
          lastPixelRef.current = world
          drawPixel(world.x, world.y)
        }
      } else if (e.touches.length === 2 && touchStartRef.current) {
        const [t1, t2] = [e.touches[0], e.touches[1]]
        const centerX = (t1.clientX + t2.clientX) / 2
        const centerY = (t1.clientY + t2.clientY) / 2
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)

        // Pan
        const dx = centerX - lastPosRef.current.x
        const dy = centerY - lastPosRef.current.y
        lastPosRef.current = { x: centerX, y: centerY }

        // Zoom
        const scale = dist / touchStartRef.current.dist
        touchStartRef.current.dist = dist

        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.zoom * scale))

        setViewport({
          x: viewport.x - dx / viewport.zoom,
          y: viewport.y - dy / viewport.zoom,
          zoom: newZoom,
        })
      }
    },
    [isDrawing, viewport, setViewport, screenToWorld, drawPixel]
  )

  const handleTouchEnd = useCallback(() => {
    setIsDrawing(false)
    lastPixelRef.current = null
    touchStartRef.current = null
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-neutral-600 shadow-sm">
        {Math.round(viewport.zoom * 10) / 10}x
      </div>
    </div>
  )
}
