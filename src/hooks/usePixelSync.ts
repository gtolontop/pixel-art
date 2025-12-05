'use client'

import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { useCanvasStore } from '@/lib/store'
import type { Pixel } from '@/types'

export function usePixelSync(canvasId: string) {
  const setPixels = useCanvasStore((state) => state.setPixels)
  const hasLoadedInitial = useRef(false)
  const isSyncingRef = useRef(false)

  // Load pixels on mount
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || hasLoadedInitial.current) return
    hasLoadedInitial.current = true

    const loadPixels = async () => {
      console.log('Loading pixels for canvas:', canvasId)
      try {
        const { data, error } = await supabase
          .from('pixels')
          .select('x, y, color, placed_at')
          .eq('canvas_id', canvasId)
          .order('placed_at', { ascending: false })
          .limit(50000)

        if (error) {
          console.error('Error loading pixels:', error)
          return
        }

        if (data && data.length > 0) {
          console.log('Loaded', data.length, 'pixels')
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

    loadPixels()
  }, [canvasId, setPixels])

  // Sync pending pixels periodically
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const syncPixels = async () => {
      const store = useCanvasStore.getState()
      const pending = store.pendingPixels

      if (pending.length === 0 || isSyncingRef.current) return

      isSyncingRef.current = true
      const pixelsToSync = [...pending]
      store.clearPendingPixels()

      console.log('Syncing', pixelsToSync.length, 'pixels to Supabase')

      try {
        const { error } = await supabase.from('pixels').insert(
          pixelsToSync.map((p) => ({
            canvas_id: canvasId,
            x: p.x,
            y: p.y,
            color: p.color,
          }))
        )

        if (error) {
          console.error('Error syncing pixels:', error)
        } else {
          console.log('Pixels saved!')
        }
      } catch (err) {
        console.error('Error syncing pixels:', err)
      } finally {
        isSyncingRef.current = false
      }
    }

    const interval = setInterval(syncPixels, 200)
    return () => clearInterval(interval)
  }, [canvasId])

  return { isConfigured: isSupabaseConfigured }
}
