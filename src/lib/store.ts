import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Tool, User, Viewport, Pixel } from '@/types'
import { DEFAULT_ZOOM, PRESET_COLORS } from '@/types'

interface CanvasState {
  // User
  user: User | null
  setUser: (user: User | null) => void

  // Viewport
  viewport: Viewport
  setViewport: (viewport: Partial<Viewport>) => void

  // Tool
  currentTool: Tool
  setTool: (tool: Tool) => void

  // Brush
  brushSize: number
  setBrushSize: (size: number) => void

  // Color
  currentColor: string
  setColor: (color: string) => void
  recentColors: string[]
  addRecentColor: (color: string) => void

  // Pixels (local state)
  pixels: Map<string, string> // key: "x,y", value: color
  setPixel: (x: number, y: number, color: string) => void
  setPixels: (pixels: Pixel[]) => void
  getPixel: (x: number, y: number) => string | undefined
  clearPixels: () => void

  // Pending pixels (to sync)
  pendingPixels: Pixel[]
  addPendingPixel: (pixel: Pixel) => void
  clearPendingPixels: () => void
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),

      // Viewport
      viewport: { x: 0, y: 0, zoom: DEFAULT_ZOOM },
      setViewport: (viewport) =>
        set((state) => ({ viewport: { ...state.viewport, ...viewport } })),

      // Tool
      currentTool: 'brush',
      setTool: (tool) => set({ currentTool: tool }),

      // Brush
      brushSize: 1,
      setBrushSize: (size) => set({ brushSize: Math.max(1, Math.min(10, size)) }),

      // Color
      currentColor: PRESET_COLORS[3], // Default to dark
      setColor: (color) => set({ currentColor: color }),
      recentColors: [],
      addRecentColor: (color) =>
        set((state) => {
          const filtered = state.recentColors.filter((c) => c !== color)
          return { recentColors: [color, ...filtered].slice(0, 8) }
        }),

      // Pixels
      pixels: new Map(),
      setPixel: (x, y, color) =>
        set((state) => {
          const newPixels = new Map(state.pixels)
          const key = `${x},${y}`
          if (color === '') {
            newPixels.delete(key)
          } else {
            newPixels.set(key, color)
          }
          return { pixels: newPixels }
        }),
      setPixels: (pixels) =>
        set((state) => {
          const newPixels = new Map(state.pixels)
          for (const pixel of pixels) {
            const key = `${pixel.x},${pixel.y}`
            if (pixel.color === '') {
              newPixels.delete(key)
            } else {
              newPixels.set(key, pixel.color)
            }
          }
          return { pixels: newPixels }
        }),
      getPixel: (x, y) => get().pixels.get(`${x},${y}`),
      clearPixels: () => set({ pixels: new Map() }),

      // Pending pixels
      pendingPixels: [],
      addPendingPixel: (pixel) =>
        set((state) => ({ pendingPixels: [...state.pendingPixels, pixel] })),
      clearPendingPixels: () => set({ pendingPixels: [] }),
    }),
    {
      name: 'pixel-art-storage',
      partialize: (state) => ({
        user: state.user,
        recentColors: state.recentColors,
      }),
    }
  )
)
