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
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: screen.x,
              top: screen.y,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Cursor */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={cursor.color}
              className="drop-shadow-md"
            >
              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z" />
              <path
                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>

            {/* Username label */}
            <div
              className="absolute left-5 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap shadow-md"
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
