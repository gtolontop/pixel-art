'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useCanvasStore } from '@/lib/store'

const CANVAS_SIZE = 400
const PIXEL_SIZE = 4

export function Timelapse() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const history = useCanvasStore((state) => state.history)
  const pixels = useCanvasStore((state) => state.pixels)

  // Calculate all unique pixels from history in order
  const getHistoricalPixels = useCallback(() => {
    const allPixels: { x: number; y: number; color: string }[] = []

    for (const entry of history) {
      for (const pixel of entry.pixels) {
        if (pixel.color) {
          allPixels.push(pixel)
        }
      }
    }

    return allPixels
  }, [history])

  // Calculate bounds from all pixels (current + historical)
  const getBounds = useCallback(() => {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    // Include current pixels
    pixels.forEach((_, key) => {
      const [x, y] = key.split(',').map(Number)
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    })

    // Include historical pixels
    for (const entry of history) {
      for (const pixel of entry.pixels) {
        minX = Math.min(minX, pixel.x)
        maxX = Math.max(maxX, pixel.x)
        minY = Math.min(minY, pixel.y)
        maxY = Math.max(maxY, pixel.y)
      }
    }

    if (minX === Infinity) {
      return { minX: -25, maxX: 25, minY: -25, maxY: 25 }
    }

    // Add padding
    const padding = 5
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
    }
  }, [pixels, history])

  // Render canvas at specific frame
  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const bounds = getBounds()
    const worldWidth = bounds.maxX - bounds.minX
    const worldHeight = bounds.maxY - bounds.minY
    const scale = Math.min(CANVAS_SIZE / worldWidth, CANVAS_SIZE / worldHeight)

    // Clear
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Calculate offset to center
    const offsetX = (CANVAS_SIZE - worldWidth * scale) / 2
    const offsetY = (CANVAS_SIZE - worldHeight * scale) / 2

    // Draw grid
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      const px = offsetX + (x - bounds.minX) * scale
      ctx.beginPath()
      ctx.moveTo(px, 0)
      ctx.lineTo(px, CANVAS_SIZE)
      ctx.stroke()
    }
    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      const py = offsetY + (y - bounds.minY) * scale
      ctx.beginPath()
      ctx.moveTo(0, py)
      ctx.lineTo(CANVAS_SIZE, py)
      ctx.stroke()
    }

    // Draw pixels up to current frame
    const historicalPixels = getHistoricalPixels()
    const pixelsToDraw = historicalPixels.slice(0, frameIndex)

    // Use a map to track final colors (later pixels overwrite earlier ones)
    const pixelMap = new Map<string, string>()
    for (const pixel of pixelsToDraw) {
      const key = `${pixel.x},${pixel.y}`
      pixelMap.set(key, pixel.color)
    }

    // Draw all pixels
    pixelMap.forEach((color, key) => {
      const [x, y] = key.split(',').map(Number)
      const px = offsetX + (x - bounds.minX) * scale
      const py = offsetY + (y - bounds.minY) * scale

      ctx.fillStyle = color
      ctx.fillRect(px, py, scale, scale)
    })

    // Draw origin
    const originX = offsetX + (0 - bounds.minX) * scale
    const originY = offsetY + (0 - bounds.minY) * scale
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.beginPath()
    ctx.arc(originX, originY, 3, 0, Math.PI * 2)
    ctx.fill()
  }, [getBounds, getHistoricalPixels])

  // Play animation
  const play = useCallback(() => {
    const historicalPixels = getHistoricalPixels()
    if (historicalPixels.length === 0) return

    setIsPlaying(true)
    let frame = progress === 1 ? 0 : Math.floor(progress * historicalPixels.length)

    const animate = () => {
      if (frame >= historicalPixels.length) {
        setIsPlaying(false)
        setProgress(1)
        return
      }

      renderFrame(frame)
      setProgress(frame / historicalPixels.length)
      frame += Math.ceil(speed)

      animationRef.current = setTimeout(animate, 16) // ~60fps base
    }

    animate()
  }, [progress, speed, getHistoricalPixels, renderFrame])

  // Pause animation
  const pause = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current)
      animationRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // Reset animation
  const reset = useCallback(() => {
    pause()
    setProgress(0)
    renderFrame(0)
  }, [pause, renderFrame])

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [])

  // Initial render when opening
  useEffect(() => {
    if (isOpen) {
      const historicalPixels = getHistoricalPixels()
      const frame = Math.floor(progress * historicalPixels.length)
      renderFrame(frame)
    }
  }, [isOpen, progress, renderFrame, getHistoricalPixels])

  // Handle seek
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setProgress(value)

    const historicalPixels = getHistoricalPixels()
    const frame = Math.floor(value * historicalPixels.length)
    renderFrame(frame)
  }, [getHistoricalPixels, renderFrame])

  const historicalPixels = getHistoricalPixels()
  const hasHistory = historicalPixels.length > 0

  return (
    <>
      {/* Timelapse button */}
      <button
        onClick={() => setIsOpen(true)}
        disabled={!hasHistory}
        className="fixed bottom-20 md:bottom-4 right-4 md:right-[180px] z-30 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={hasHistory ? 'View timelapse' : 'No drawing history yet'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-[90vw] max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-800">Session Timelapse</h3>
              <button
                onClick={() => {
                  pause()
                  setIsOpen(false)
                }}
                className="p-1 hover:bg-neutral-200 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Canvas */}
            <div className="p-4 bg-neutral-100">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="rounded-lg shadow-inner"
              />
            </div>

            {/* Controls */}
            <div className="p-4 space-y-3">
              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500 w-16">
                  {Math.floor(progress * historicalPixels.length)} / {historicalPixels.length}
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.001}
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Play/Pause */}
                  <button
                    onClick={isPlaying ? pause : play}
                    className="w-10 h-10 bg-neutral-900 text-white rounded-lg flex items-center justify-center hover:bg-neutral-800 transition-colors"
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>

                  {/* Reset */}
                  <button
                    onClick={reset}
                    className="w-10 h-10 bg-neutral-100 text-neutral-600 rounded-lg flex items-center justify-center hover:bg-neutral-200 transition-colors"
                    title="Reset"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>

                {/* Speed control */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Speed</span>
                  <select
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="px-2 py-1 bg-neutral-100 rounded text-sm border-none focus:ring-2 focus:ring-neutral-300"
                  >
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={5}>5x</option>
                    <option value={10}>10x</option>
                    <option value={20}>20x</option>
                  </select>
                </div>
              </div>

              {/* Info */}
              <p className="text-xs text-neutral-400 text-center">
                Replay of {historicalPixels.length} pixels drawn this session
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
