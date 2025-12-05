'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { useCanvasStore } from '@/lib/store'
import type { Pixel } from '@/types'

let socket: Socket | null = null

export function useSocket(canvasId: string) {
  const setPixels = useCanvasStore((state) => state.setPixels)
  const currentRoomRef = useRef<string | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!socket) {
      socket = io({
        transports: ['websocket', 'polling'],
      })

      socket.on('connect', () => {})

      socket.on('disconnect', () => {
        currentRoomRef.current = null
      })
    }

    // Join the canvas room
    if (socket && canvasId && currentRoomRef.current !== canvasId) {
      if (currentRoomRef.current) {
        socket.emit('leave-room', currentRoomRef.current)
      }
      socket.emit('join-room', canvasId)
      currentRoomRef.current = canvasId
    }

    return () => {}
  }, [canvasId])

  // Listen for pixels from other users
  useEffect(() => {
    if (!socket) return

    const handlePixel = (pixel: Pixel) => {
      setPixels([pixel])
    }

    const handlePixels = (pixels: Pixel[]) => {
      setPixels(pixels)
    }

    socket.on('pixel', handlePixel)
    socket.on('pixels', handlePixels)

    return () => {
      socket?.off('pixel', handlePixel)
      socket?.off('pixels', handlePixels)
    }
  }, [setPixels])

  // Sync pending pixels: Socket.IO + Supabase
  useEffect(() => {
    const syncPixels = () => {
      const store = useCanvasStore.getState()
      const pending = store.pendingPixels

      if (pending.length === 0) return

      const pixelsToSync = [...pending]
      store.clearPendingPixels()

      // Send via Socket.IO for real-time (sync, fast)
      if (socket && socket.connected) {
        socket.emit('pixels', { room: canvasId, pixels: pixelsToSync })
      }

      // Save to Supabase for persistence (async, don't block)
      if (isSupabaseConfigured && supabase) {
        supabase.from('pixels').insert(
          pixelsToSync.map((p) => ({
            canvas_id: canvasId,
            x: p.x,
            y: p.y,
            color: p.color,
          }))
        ).then(({ error }) => {
          if (error) console.error('Supabase error:', error)
        })
      }
    }

    const interval = setInterval(syncPixels, 16) // ~60fps
    return () => clearInterval(interval)
  }, [canvasId])

  return {}
}
