'use client'

import { useState } from 'react'
import { FloatingPanel } from './FloatingPanel'
import { useCanvasStore } from '@/lib/store'
import { PRESET_COLORS } from '@/types'
import clsx from 'clsx'

export function ColorPicker() {
  const currentColor = useCanvasStore((state) => state.currentColor)
  const setColor = useCanvasStore((state) => state.setColor)
  const recentColors = useCanvasStore((state) => state.recentColors)
  const addRecentColor = useCanvasStore((state) => state.addRecentColor)
  const [customColor, setCustomColor] = useState(currentColor)

  const handleColorSelect = (color: string) => {
    setColor(color)
    addRecentColor(color)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    setColor(color)
  }

  const handleCustomColorBlur = () => {
    addRecentColor(customColor)
  }

  return (
    <FloatingPanel title="Colors" defaultPosition={{ x: 20, y: 20 }}>
      <div className="space-y-4">
        {/* Current color preview */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg border-2 border-neutral-200 shadow-inner"
            style={{ backgroundColor: currentColor }}
          />
          <div className="flex-1">
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              onBlur={handleCustomColorBlur}
              className="w-full h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={currentColor}
              onChange={(e) => {
                const val = e.target.value
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  setCustomColor(val)
                  if (val.length === 7) setColor(val)
                }
              }}
              className="mt-1 w-full px-2 py-1 text-xs font-mono border border-neutral-200 rounded"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Preset colors */}
        <div>
          <div className="text-xs font-medium text-neutral-500 mb-2">Palette</div>
          <div className="grid grid-cols-8 gap-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={clsx(
                  'w-7 h-7 rounded border-2 transition-all hover:scale-110',
                  currentColor === color
                    ? 'border-neutral-800 shadow-md'
                    : 'border-neutral-200 hover:border-neutral-400'
                )}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Recent colors */}
        {recentColors.length > 0 && (
          <div>
            <div className="text-xs font-medium text-neutral-500 mb-2">Recent</div>
            <div className="flex gap-1 flex-wrap">
              {recentColors.map((color, i) => (
                <button
                  key={`${color}-${i}`}
                  onClick={() => handleColorSelect(color)}
                  className={clsx(
                    'w-6 h-6 rounded border-2 transition-all hover:scale-110',
                    currentColor === color
                      ? 'border-neutral-800'
                      : 'border-neutral-200 hover:border-neutral-400'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </FloatingPanel>
  )
}
