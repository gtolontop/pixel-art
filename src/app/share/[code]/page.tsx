'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import Link from 'next/link'

interface SharedView {
  center_x: number
  center_y: number
  zoom: number
}

interface Pixel {
  x: number
  y: number
  color: string
}

export default function SharePage() {
  const params = useParams()
  const code = params.code as string

  const [view, setView] = useState<SharedView | null>(null)
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSharedView() {
      if (!isSupabaseConfigured || !supabase) {
        setError('Supabase not configured')
        setLoading(false)
        return
      }

      try {
        // Load shared view data
        const { data: viewData, error: viewError } = await supabase
          .from('shared_views')
          .select('*')
          .eq('short_code', code)
          .single()

        if (viewError || !viewData) {
          setError('Share link not found')
          setLoading(false)
          return
        }

        setView({
          center_x: viewData.center_x,
          center_y: viewData.center_y,
          zoom: viewData.zoom,
        })

        // Load pixels around the shared view
        const padding = 100
        const { data: pixelData } = await supabase
          .from('pixels')
          .select('x, y, color')
          .gte('x', viewData.center_x - padding)
          .lte('x', viewData.center_x + padding)
          .gte('y', viewData.center_y - padding)
          .lte('y', viewData.center_y + padding)
          .order('placed_at', { ascending: false })

        if (pixelData) {
          // Dedupe pixels
          const pixelMap = new Map<string, Pixel>()
          for (const p of pixelData) {
            const key = `${p.x},${p.y}`
            if (!pixelMap.has(key) && p.color) {
              pixelMap.set(key, { x: p.x, y: p.y, color: p.color })
            }
          }
          setPixels(Array.from(pixelMap.values()))
        }
      } catch (err) {
        setError('Failed to load shared view')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadSharedView()
  }, [code])

  // Render canvas preview
  useEffect(() => {
    if (!view || pixels.length === 0) return

    const canvas = document.getElementById('preview-canvas') as HTMLCanvasElement
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const pixelSize = 6
    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2

    // Clear
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, width, height)

    // Draw pixels
    for (const pixel of pixels) {
      const screenX = centerX + (pixel.x - view.center_x) * pixelSize
      const screenY = centerY + (pixel.y - view.center_y) * pixelSize
      ctx.fillStyle = pixel.color
      ctx.fillRect(screenX, screenY, pixelSize, pixelSize)
    }
  }, [view, pixels])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center max-w-sm mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-neutral-800 mb-2">Link Not Found</h1>
          <p className="text-neutral-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Go to Canvas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full">
        <div className="p-6 border-b border-neutral-100">
          <h1 className="text-xl font-semibold text-neutral-800">Shared Pixel Art</h1>
          <p className="text-sm text-neutral-500 mt-1">{pixels.length} pixels</p>
        </div>

        <div className="p-6 bg-neutral-50">
          <canvas
            id="preview-canvas"
            width={600}
            height={400}
            className="w-full rounded-lg border border-neutral-200"
          />
        </div>

        <div className="p-6 flex gap-3">
          <Link
            href={`/?x=${view?.center_x}&y=${view?.center_y}&z=${view?.zoom}`}
            className="flex-1 px-4 py-3 bg-neutral-900 text-white text-center rounded-xl hover:bg-neutral-800 transition-colors font-medium"
          >
            Open in Editor
          </Link>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
            }}
            className="px-4 py-3 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
