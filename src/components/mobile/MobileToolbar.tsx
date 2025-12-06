'use client'

import { useState } from 'react'
import { useCanvasStore } from '@/lib/store'
import { PRESET_COLORS, MIN_ZOOM, MAX_ZOOM } from '@/types'
import type { Tool } from '@/types'
import clsx from 'clsx'

const tools: { id: Tool; icon: JSX.Element }[] = [
  {
    id: 'brush',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    id: 'eraser',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  {
    id: 'eyedropper',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
]

export function MobileToolbar() {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBrushSize, setShowBrushSize] = useState(false)

  const currentTool = useCanvasStore((state) => state.currentTool)
  const setTool = useCanvasStore((state) => state.setTool)
  const currentColor = useCanvasStore((state) => state.currentColor)
  const setColor = useCanvasStore((state) => state.setColor)
  const addRecentColor = useCanvasStore((state) => state.addRecentColor)
  const recentColors = useCanvasStore((state) => state.recentColors)
  const brushSize = useCanvasStore((state) => state.brushSize)
  const setBrushSize = useCanvasStore((state) => state.setBrushSize)
  const viewport = useCanvasStore((state) => state.viewport)
  const setViewport = useCanvasStore((state) => state.setViewport)

  const handleColorSelect = (color: string) => {
    setColor(color)
    addRecentColor(color)
    setShowColorPicker(false)
  }

  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 1.5 : 0.67
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.zoom * factor))
    setViewport({ zoom: newZoom })
  }

  return (
    <>
      {/* Color picker modal */}
      {showColorPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowColorPicker(false)}
          />
          <div className="relative bg-white rounded-t-2xl p-4 w-full max-w-md pb-8 animate-slide-up">
            <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-3">Couleurs</h3>

            {/* Color input */}
            <div className="flex gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-xl border-2 border-neutral-200 shadow-inner flex-shrink-0"
                style={{ backgroundColor: currentColor }}
              />
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 h-14 rounded-xl cursor-pointer"
              />
            </div>

            {/* Preset colors */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={clsx(
                    'aspect-square rounded-lg border-2 transition-transform active:scale-95',
                    currentColor === color ? 'border-neutral-800 scale-110' : 'border-neutral-200'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Recent colors */}
            {recentColors.length > 0 && (
              <div>
                <div className="text-sm text-neutral-500 mb-2">Recents</div>
                <div className="flex gap-2 flex-wrap">
                  {recentColors.slice(0, 8).map((color, i) => (
                    <button
                      key={`${color}-${i}`}
                      onClick={() => handleColorSelect(color)}
                      className="w-10 h-10 rounded-lg border-2 border-neutral-200 active:scale-95 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Brush size modal */}
      {showBrushSize && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowBrushSize(false)}
          />
          <div className="relative bg-white rounded-t-2xl p-4 w-full max-w-md pb-8">
            <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-4">Taille du pinceau</h3>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={10}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1 h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
              <div className="flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-xl">
                <div
                  className="bg-neutral-800 rounded-sm"
                  style={{ width: brushSize * 4, height: brushSize * 4 }}
                />
              </div>
            </div>
            <div className="text-center mt-2 text-lg font-mono">{brushSize}px</div>
          </div>
        </div>
      )}

      {/* Zoom controls - top right */}
      <div className="fixed top-4 right-4 z-40 flex flex-col gap-2 md:hidden">
        <button
          onClick={() => handleZoom('in')}
          className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center active:bg-neutral-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center active:bg-neutral-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <div className="bg-white/90 rounded-xl px-2 py-1 text-center text-sm font-medium shadow">
          {Math.round(viewport.zoom * 10) / 10}x
        </div>
      </div>

      {/* Main toolbar - bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="bg-white border-t border-neutral-200 px-2 py-2 pb-safe">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {/* Color button */}
            <button
              onClick={() => setShowColorPicker(true)}
              className="flex flex-col items-center gap-1 p-2"
            >
              <div
                className="w-10 h-10 rounded-xl border-2 border-neutral-300 shadow-sm"
                style={{ backgroundColor: currentColor }}
              />
              <span className="text-xs text-neutral-500">Couleur</span>
            </button>

            {/* Tools */}
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setTool(tool.id)}
                className={clsx(
                  'flex flex-col items-center gap-1 p-2 rounded-xl transition-colors',
                  currentTool === tool.id ? 'bg-neutral-900 text-white' : 'text-neutral-600'
                )}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  {tool.icon}
                </div>
                <span className="text-xs capitalize">{tool.id === 'eyedropper' ? 'Pipette' : tool.id === 'brush' ? 'Pinceau' : 'Gomme'}</span>
              </button>
            ))}

            {/* Brush size button */}
            {(currentTool === 'brush' || currentTool === 'eraser') && (
              <button
                onClick={() => setShowBrushSize(true)}
                className="flex flex-col items-center gap-1 p-2"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-neutral-100 rounded-xl">
                  <div
                    className="bg-neutral-800 rounded-sm"
                    style={{ width: brushSize * 3, height: brushSize * 3 }}
                  />
                </div>
                <span className="text-xs text-neutral-500">{brushSize}px</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
