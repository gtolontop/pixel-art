'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { useCanvasStore } from '@/lib/store'
import { groupPixelsByChunk, mergeChunkPixels, type ChunkData } from '@/lib/canvas/ChunkedCanvas'
import type { Pixel } from '@/types'

let socket: Socket | null = null

// Cache for chunk data to avoid constant DB reads
const chunkCache = new Map<string, ChunkData>()

export function useSocket(canvasId: string) {
  const setPixels = useCanvasStore((state) => state.setPixels)
  const currentRoomRef = useRef<string | null>(null)
  const pendingChunkUpdates = useRef<Map<string, { chunkX: number; chunkY: number; pixels: { localX: number; localY: number; color: string }[] }>>(new Map())

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

  // Sync pending pixels via Socket.IO (fast, real-time)
  useEffect(() => {
    const syncToSocket = () => {
      const store = useCanvasStore.getState()
      const pending = store.pendingPixels

      if (pending.length === 0) return

      const pixelsToSync = [...pending]
      store.clearPendingPixels()

      // Send via Socket.IO for real-time
      if (socket && socket.connected) {
        socket.emit('pixels', { room: canvasId, pixels: pixelsToSync })
      }

      // Accumulate for chunk-based DB sync
      const grouped = groupPixelsByChunk(pixelsToSync)
      for (const [key, data] of grouped) {
        if (!pendingChunkUpdates.current.has(key)) {
          pendingChunkUpdates.current.set(key, { chunkX: data.chunkX, chunkY: data.chunkY, pixels: [] })
        }
        pendingChunkUpdates.current.get(key)!.pixels.push(...data.pixels)
      }
    }

    const interval = setInterval(syncToSocket, 16) // ~60fps for Socket.IO
    return () => clearInterval(interval)
  }, [canvasId])

  // Sync chunks to Supabase (debounced, batched)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const syncChunksToDb = async () => {
      if (!supabase || pendingChunkUpdates.current.size === 0) return

      const updates = new Map(pendingChunkUpdates.current)
      pendingChunkUpdates.current.clear()

      for (const [key, data] of updates) {
        try {
          // Get existing chunk from cache or DB
          let existingData = chunkCache.get(key) || null

          if (!existingData) {
            const { data: existing } = await supabase
              .from('canvas_chunks')
              .select('pixels')
              .eq('canvas_id', canvasId)
              .eq('chunk_x', data.chunkX)
              .eq('chunk_y', data.chunkY)
              .single()

            if (existing?.pixels) {
              existingData = existing.pixels as ChunkData
            }
          }

          // Merge pixels
          const merged = mergeChunkPixels(existingData, data.pixels)
          chunkCache.set(key, merged)

          // Upsert chunk
          await supabase
            .from('canvas_chunks')
            .upsert({
              canvas_id: canvasId,
              chunk_x: data.chunkX,
              chunk_y: data.chunkY,
              pixels: merged,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'canvas_id,chunk_x,chunk_y',
            })
        } catch (err) {
          console.error('Chunk sync error:', err)
          // Re-add to pending on failure
          if (!pendingChunkUpdates.current.has(key)) {
            pendingChunkUpdates.current.set(key, data)
          } else {
            pendingChunkUpdates.current.get(key)!.pixels.push(...data.pixels)
          }
        }
      }
    }

    const interval = setInterval(syncChunksToDb, 500) // Sync chunks every 500ms
    return () => clearInterval(interval)
  }, [canvasId])

  return {}
}
