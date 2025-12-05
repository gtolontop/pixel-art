'use client'

import { useState } from 'react'
import { FloatingPanel } from './FloatingPanel'
import { useCanvasStore } from '@/lib/store'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { nanoid } from 'nanoid'

interface UserPanelProps {
  canvasId?: string
}

export function UserPanel({ canvasId }: UserPanelProps) {
  const user = useCanvasStore((state) => state.user)
  const setUser = useCanvasStore((state) => state.setUser)
  const viewport = useCanvasStore((state) => state.viewport)
  const setViewport = useCanvasStore((state) => state.setViewport)
  const pixels = useCanvasStore((state) => state.pixels)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  const handleExport = () => {
    // Create a canvas with the visible area
    const exportCanvas = document.createElement('canvas')
    const size = 512
    exportCanvas.width = size
    exportCanvas.height = size
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // Calculate bounds
    const pixelSize = 8
    const halfSize = (size / pixelSize) / 2
    const centerX = Math.round(viewport.x)
    const centerY = Math.round(viewport.y)

    // Draw pixels
    pixels.forEach((color, key) => {
      const [x, y] = key.split(',').map(Number)
      const relX = x - centerX + halfSize
      const relY = y - centerY + halfSize

      if (relX >= 0 && relX < size / pixelSize && relY >= 0 && relY < size / pixelSize) {
        ctx.fillStyle = color
        ctx.fillRect(relX * pixelSize, relY * pixelSize, pixelSize, pixelSize)
      }
    })

    // Download
    const link = document.createElement('a')
    link.download = 'pixel-art.png'
    link.href = exportCanvas.toDataURL('image/png')
    link.click()
  }

  const handleReset = () => {
    setViewport({ x: 0, y: 0, zoom: 10 })
  }

  const handleShare = async () => {
    if (!isSupabaseConfigured || !supabase) {
      // Fallback: copy URL with coordinates
      const url = `${window.location.origin}?x=${Math.round(viewport.x)}&y=${Math.round(viewport.y)}&z=${viewport.zoom.toFixed(1)}`
      await navigator.clipboard.writeText(url)
      setShareUrl(url)
      setTimeout(() => setShareUrl(null), 3000)
      return
    }

    setIsSharing(true)
    try {
      const shortCode = nanoid(8)
      const { error } = await supabase.from('shared_views').insert({
        short_code: shortCode,
        center_x: Math.round(viewport.x),
        center_y: Math.round(viewport.y),
        zoom: viewport.zoom,
        created_by: user?.id || null,
      })

      if (error) throw error

      const url = `${window.location.origin}/share/${shortCode}`
      await navigator.clipboard.writeText(url)
      setShareUrl(url)
      setTimeout(() => setShareUrl(null), 5000)
    } catch (err) {
      console.error('Error creating share link:', err)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <FloatingPanel title="Menu" defaultPosition={{ x: 20, y: 480 }}>
      <div className="space-y-3 min-w-[160px]">
        {user && (
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-neutral-700">{user.username}</span>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleReset}
            className="w-full px-3 py-2 text-sm text-left text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go to origin
          </button>

          <button
            onClick={handleExport}
            className="w-full px-3 py-2 text-sm text-left text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export PNG
          </button>

          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full px-3 py-2 text-sm text-left text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            {isSharing ? 'Creating...' : 'Share Link'}
          </button>

          {shareUrl && (
            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700 font-medium">Link copied!</p>
              <p className="text-xs text-green-600 truncate mt-0.5">{shareUrl}</p>
            </div>
          )}

          {user && (
            <button
              onClick={() => setUser(null)}
              className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          )}
        </div>

        <div className="pt-2 border-t border-neutral-100 text-xs text-neutral-400">
          {pixels.size} pixels placed
        </div>
      </div>
    </FloatingPanel>
  )
}
