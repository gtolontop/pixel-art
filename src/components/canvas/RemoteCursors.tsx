'use client'

import { useCanvasStore } from '@/lib/store'

export function RemoteCursors() {
  const remoteCursors = useCanvasStore((state) => state.remoteCursors)
  const viewport = useCanvasStore((state) => state.viewport)

  // Convert world coordinates to screen position
  const worldToScreen = (worldX: number, worldY: number, containerWidth: number, containerHeight: number) => {
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    const screenX = centerX + (worldX - viewport.x) * viewport.zoom
    const screenY = centerY + (worldY - viewport.y) * viewport.zoom
    return { x: screenX, y: screenY }
  }

  const cursors = Array.from(remoteCursors.values())

  if (cursors.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {cursors.map((cursor) => {
        // Use viewport dimensions (approximate, will be correct on render)
        const screen = worldToScreen(cursor.x, cursor.y, window.innerWidth, window.innerHeight)

        // Don't render if off-screen
        if (screen.x < -50 || screen.x > window.innerWidth + 50 || screen.y < -50 || screen.y > window.innerHeight + 50) {
          return null
        }

        return (
          <div
            key={cursor.visibleId}
            className="absolute transition-all duration-100 ease-out"
            style={{
              left: screen.x,
              top: screen.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Touch/cursor indicator - pulsing circle */}
            <div className="relative flex items-center justify-center">
              {/* Outer pulse ring */}
              <div
                className="absolute w-8 h-8 rounded-full opacity-30 animate-ping"
                style={{ backgroundColor: cursor.color }}
              />
              {/* Inner solid circle */}
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                style={{ backgroundColor: cursor.color }}
              >
                <span className="text-[10px] font-bold text-white">
                  {cursor.username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Username label */}
            <div
              className="absolute left-1/2 -translate-x-1/2 top-8 px-2 py-0.5 rounded-full text-[10px] font-medium text-white whitespace-nowrap shadow-md"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.username}
            </div>
          </div>
        )
      })}
    </div>
  )
}
