'use client'

import { FloatingPanel } from './FloatingPanel'
import { useCanvasStore } from '@/lib/store'
import type { Tool } from '@/types'
import clsx from 'clsx'

const tools: { id: Tool; name: string; icon: JSX.Element }[] = [
  {
    id: 'brush',
    name: 'Brush',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    ),
  },
  {
    id: 'eraser',
    name: 'Eraser',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    ),
  },
  {
    id: 'eyedropper',
    name: 'Eyedropper',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    ),
  },
]

export function ToolPanel() {
  const currentTool = useCanvasStore((state) => state.currentTool)
  const setTool = useCanvasStore((state) => state.setTool)
  const brushSize = useCanvasStore((state) => state.brushSize)
  const setBrushSize = useCanvasStore((state) => state.setBrushSize)

  return (
    <FloatingPanel title="Tools" defaultPosition={{ x: 20, y: 280 }}>
      <div className="space-y-4">
        {/* Tool buttons */}
        <div className="flex gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setTool(tool.id)}
              className={clsx(
                'w-10 h-10 flex items-center justify-center rounded-lg transition-all',
                currentTool === tool.id
                  ? 'bg-neutral-900 text-white shadow-md'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
              title={tool.name}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Brush size */}
        {(currentTool === 'brush' || currentTool === 'eraser') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-500">Size</span>
              <span className="text-xs font-mono text-neutral-700">{brushSize}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
            />
            {/* Size preview */}
            <div className="mt-3 flex items-center justify-center">
              <div
                className="bg-neutral-800 rounded-sm"
                style={{
                  width: brushSize * 4,
                  height: brushSize * 4,
                }}
              />
            </div>
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="pt-2 border-t border-neutral-100">
          <div className="text-xs text-neutral-400 space-y-1">
            <div>
              <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono">B</kbd> Brush
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono">E</kbd> Eraser
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono">I</kbd> Eyedropper
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono">Alt</kbd>+drag Pan
            </div>
          </div>
        </div>
      </div>
    </FloatingPanel>
  )
}
