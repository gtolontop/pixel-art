'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { useCanvasStore, type ChatMessage } from '@/lib/store'
import { groupPixelsByChunk, mergeChunkPixels, type ChunkData } from '@/lib/canvas/ChunkedCanvas'
import type { Pixel } from '@/types'

let socket: Socket | null = null

// Cache for chunk data to avoid constant DB reads
const chunkCache = new Map<string, ChunkData>()

export function useSocket(canvasId: string) {
  const setPixels = useCanvasStore((state) => state.setPixels)
  const setRemoteCursor = useCanvasStore((state) => state.setRemoteCursor)
  const removeRemoteCursor = useCanvasStore((state) => state.removeRemoteCursor)
  const clearOldCursors = useCanvasStore((state) => state.clearOldCursors)
  const addChatMessage = useCanvasStore((state) => state.addChatMessage)
  const setConnectedUsers = useCanvasStore((state) => state.setConnectedUsers)
  const addConnectedUser = useCanvasStore((state) => state.addConnectedUser)
  const removeConnectedUser = useCanvasStore((state) => state.removeConnectedUser)
  const user = useCanvasStore((state) => state.user)
  const cursorPosition = useCanvasStore((state) => state.cursorPosition)
  const currentRoomRef = useRef<string | null>(null)
  const pendingChunkUpdates = useRef<Map<string, { chunkX: number; chunkY: number; pixels: { localX: number; localY: number; color: string }[] }>>(new Map())
  const lastCursorSent = useRef<{ x: number; y: number } | null>(null)

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

    // Join the canvas room with user info
    if (socket && canvasId && currentRoomRef.current !== canvasId) {
      if (currentRoomRef.current) {
        socket.emit('leave-room', currentRoomRef.current)
      }
      socket.emit('join-room', { room: canvasId, user })
      currentRoomRef.current = canvasId
    }

    return () => {}
  }, [canvasId, user])

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

  // Listen for cursors from other users
  useEffect(() => {
    if (!socket) return

    const handleCursor = (data: { odId: string; username: string; color: string; x: number; y: number }) => {
      setRemoteCursor(data.odId, {
        visibleId: data.odId,
        username: data.username,
        color: data.color,
        x: data.x,
        y: data.y,
      })
    }

    const handleUserLeft = (odId: string) => {
      removeRemoteCursor(odId)
      removeConnectedUser(odId)
    }

    const handleUsersList = (users: { odId: string; username: string; color: string }[]) => {
      setConnectedUsers(users)
    }

    const handleUserJoined = (userData: { odId: string; username: string; color: string }) => {
      addConnectedUser(userData)
    }

    socket.on('cursor', handleCursor)
    socket.on('user-left', handleUserLeft)
    socket.on('users-list', handleUsersList)
    socket.on('user-joined', handleUserJoined)

    // Clear old cursors periodically
    const cleanupInterval = setInterval(clearOldCursors, 2000)

    return () => {
      socket?.off('cursor', handleCursor)
      socket?.off('user-left', handleUserLeft)
      socket?.off('users-list', handleUsersList)
      socket?.off('user-joined', handleUserJoined)
      clearInterval(cleanupInterval)
    }
  }, [setRemoteCursor, removeRemoteCursor, clearOldCursors, setConnectedUsers, addConnectedUser, removeConnectedUser])

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return

    const handleChat = (data: { odId: string; username: string; color: string; text: string; timestamp: number }) => {
      addChatMessage({
        visibleId: data.odId,
        username: data.username,
        color: data.color,
        text: data.text,
        timestamp: data.timestamp,
      })
    }

    socket.on('chat', handleChat)

    return () => {
      socket?.off('chat', handleChat)
    }
  }, [addChatMessage])

  // Send cursor position
  useEffect(() => {
    if (!socket || !user || !cursorPosition) return

    // Throttle cursor updates
    if (
      lastCursorSent.current &&
      lastCursorSent.current.x === cursorPosition.x &&
      lastCursorSent.current.y === cursorPosition.y
    ) {
      return
    }

    lastCursorSent.current = cursorPosition
    socket.emit('cursor', {
      room: canvasId,
      cursor: {
        username: user.username,
        color: user.color,
        x: cursorPosition.x,
        y: cursorPosition.y,
      },
    })
  }, [canvasId, user, cursorPosition])

  // Send chat message function
  const sendChatMessage = useCallback(
    (text: string) => {
      if (!socket || !user || !text.trim()) return

      const message = {
        username: user.username,
        color: user.color,
        text: text.trim(),
      }

      socket.emit('chat', { room: canvasId, message })

      // Add to local messages immediately
      addChatMessage({
        visibleId: 'self',
        username: user.username,
        color: user.color,
        text: text.trim(),
        timestamp: Date.now(),
      })
    },
    [canvasId, user, addChatMessage]
  )

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

  // Sync chunks to Supabase (debounced, batched) - uses atomic merge
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const syncChunksToDb = async () => {
      if (!supabase || pendingChunkUpdates.current.size === 0) return

      const updates = new Map(pendingChunkUpdates.current)
      pendingChunkUpdates.current.clear()

      for (const [key, data] of updates) {
        try {
          // Convert pixels array to JSONB format {localX_localY: color}
          const pixelsJson: Record<string, string> = {}
          for (const p of data.pixels) {
            pixelsJson[`${p.localX}_${p.localY}`] = p.color
          }

          // Use atomic merge function to avoid race conditions
          const { error } = await supabase.rpc('merge_chunk_pixels', {
            p_canvas_id: canvasId,
            p_chunk_x: data.chunkX,
            p_chunk_y: data.chunkY,
            p_new_pixels: pixelsJson,
          })

          if (error) {
            // Fallback to regular upsert if function doesn't exist
            if (error.code === '42883') { // function does not exist
              const { data: existing } = await supabase
                .from('canvas_chunks')
                .select('pixels')
                .eq('canvas_id', canvasId)
                .eq('chunk_x', data.chunkX)
                .eq('chunk_y', data.chunkY)
                .single()

              const existingData = existing?.pixels as ChunkData | null
              const merged = mergeChunkPixels(existingData, data.pixels)

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
            } else {
              throw error
            }
          }

          // Update local cache
          const cachedData = chunkCache.get(key) || {}
          Object.assign(cachedData, pixelsJson)
          chunkCache.set(key, cachedData)
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

  return { sendChatMessage }
}
