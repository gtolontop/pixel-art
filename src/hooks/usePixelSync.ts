'use client'

import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { useCanvasStore } from '@/lib/store'
import { chunkToPixels, type ChunkData } from '@/lib/canvas/ChunkedCanvas'
import type { Pixel } from '@/types'

export function usePixelSync(canvasId: string) {
  const setPixels = useCanvasStore((state) => state.setPixels)
  const hasLoadedInitial = useRef(false)

  // Load chunks on mount
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || hasLoadedInitial.current) return
    hasLoadedInitial.current = true

    const loadChunks = async () => {
      try {
        // First try to load from new chunk-based table
        const { data: chunks, error: chunkError } = await supabase
          .from('canvas_chunks')
          .select('chunk_x, chunk_y, pixels')
          .eq('canvas_id', canvasId)

        if (!chunkError && chunks && chunks.length > 0) {
          // Load from chunks
          const allPixels: Pixel[] = []
          for (const chunk of chunks) {
            if (chunk.pixels) {
              const pixels = chunkToPixels({
                chunk_x: chunk.chunk_x,
                chunk_y: chunk.chunk_y,
                pixels: chunk.pixels as ChunkData,
              })
              allPixels.push(...pixels)
            }
          }
          if (allPixels.length > 0) {
            setPixels(allPixels)
          }
          return
        }

        // Fallback: load from old pixels table (for migration)
        const { data, error } = await supabase
          .from('pixels')
          .select('x, y, color, placed_at')
          .eq('canvas_id', canvasId)
          .order('placed_at', { ascending: false })
          .limit(100000)

        if (error) {
          console.error('Error loading pixels:', error)
          return
        }

        if (data && data.length > 0) {
          const pixelMap = new Map<string, Pixel>()
          for (const p of data) {
            const key = `${p.x},${p.y}`
            if (!pixelMap.has(key) && p.color && p.color !== '') {
              pixelMap.set(key, { x: p.x, y: p.y, color: p.color })
            }
          }
          setPixels(Array.from(pixelMap.values()))
        }
      } catch (err) {
        console.error('Error loading pixels:', err)
      }
    }

    loadChunks()
  }, [canvasId, setPixels])

  return { isConfigured: isSupabaseConfigured }
}
