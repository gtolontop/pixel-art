import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Tool, User, Viewport, Pixel } from '@/types'
import { DEFAULT_ZOOM, PRESET_COLORS } from '@/types'

// Color palettes
export const COLOR_PALETTES = {
  classic: {
    name: 'Classic',
    colors: PRESET_COLORS,
  },
  retro: {
    name: 'Retro',
    colors: [
      '#000000', '#1D2B53', '#7E2553', '#008751',
      '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
      '#FF004D', '#FFA300', '#FFEC27', '#00E436',
      '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA',
    ],
  },
  pastel: {
    name: 'Pastel',
    colors: [
      '#FFFFFF', '#F8E1E8', '#E8F1F8', '#F8F8E1',
      '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9',
      '#BAE1FF', '#E8BAFF', '#FFB3DE', '#B3FFE8',
      '#D4A5A5', '#A5D4D4', '#D4D4A5', '#A5A5D4',
    ],
  },
  neon: {
    name: 'Neon',
    colors: [
      '#000000', '#0D0D0D', '#1A1A1A', '#262626',
      '#FF00FF', '#00FFFF', '#FF0080', '#80FF00',
      '#FF3300', '#00FF66', '#3300FF', '#FFFF00',
      '#FF6600', '#00FF00', '#0066FF', '#FF00CC',
    ],
  },
  gameboy: {
    name: 'GameBoy',
    colors: [
      '#0F380F', '#306230', '#8BAC0F', '#9BBC0F',
      '#0F380F', '#306230', '#8BAC0F', '#9BBC0F',
      '#0F380F', '#306230', '#8BAC0F', '#9BBC0F',
      '#0F380F', '#306230', '#8BAC0F', '#9BBC0F',
    ],
  },
  sunset: {
    name: 'Sunset',
    colors: [
      '#1A1A2E', '#16213E', '#0F3460', '#533483',
      '#E94560', '#FF6B6B', '#FFA07A', '#FFD93D',
      '#6BCB77', '#4D96FF', '#845EC2', '#D65DB1',
      '#FF9671', '#FFC75F', '#F9F871', '#FFFFFF',
    ],
  },
}

export type PaletteName = keyof typeof COLOR_PALETTES

// History entry for undo/redo
interface HistoryEntry {
  pixels: Pixel[] // pixels that were changed
  previousColors: Map<string, string | undefined> // previous colors before change
}

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

  // Palette
  currentPalette: PaletteName
  setPalette: (palette: PaletteName) => void

  // Cursor position (world coordinates)
  cursorPosition: { x: number; y: number } | null
  setCursorPosition: (pos: { x: number; y: number } | null) => void

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

  // Undo/Redo
  history: HistoryEntry[]
  historyIndex: number
  startStroke: () => void
  endStroke: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // Current stroke tracking
  currentStroke: { pixels: Pixel[]; previousColors: Map<string, string | undefined> } | null
}

const MAX_HISTORY = 50

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

      // Palette
      currentPalette: 'classic',
      setPalette: (palette) => set({ currentPalette: palette }),

      // Cursor position
      cursorPosition: null,
      setCursorPosition: (pos) => set({ cursorPosition: pos }),

      // Pixels
      pixels: new Map(),
      setPixel: (x, y, color) =>
        set((state) => {
          const newPixels = new Map(state.pixels)
          const key = `${x},${y}`

          // Track for current stroke
          if (state.currentStroke) {
            const prevColor = state.pixels.get(key)
            if (!state.currentStroke.previousColors.has(key)) {
              state.currentStroke.previousColors.set(key, prevColor)
            }
            state.currentStroke.pixels.push({ x, y, color })
          }

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

      // Undo/Redo
      history: [],
      historyIndex: -1,
      currentStroke: null,

      startStroke: () =>
        set({ currentStroke: { pixels: [], previousColors: new Map() } }),

      endStroke: () =>
        set((state) => {
          if (!state.currentStroke || state.currentStroke.pixels.length === 0) {
            return { currentStroke: null }
          }

          // Trim history if we're not at the end (discard redo stack)
          const newHistory = state.history.slice(0, state.historyIndex + 1)
          newHistory.push({
            pixels: state.currentStroke.pixels,
            previousColors: state.currentStroke.previousColors,
          })

          // Limit history size
          if (newHistory.length > MAX_HISTORY) {
            newHistory.shift()
          }

          return {
            history: newHistory,
            historyIndex: newHistory.length - 1,
            currentStroke: null,
          }
        }),

      undo: () => {
        const state = get()
        if (state.historyIndex < 0) return

        const entry = state.history[state.historyIndex]
        const newPixels = new Map(state.pixels)
        const redoPixels: Pixel[] = []

        // Restore previous colors
        for (const [key, prevColor] of entry.previousColors) {
          const [x, y] = key.split(',').map(Number)
          const currentColor = newPixels.get(key) || ''
          redoPixels.push({ x, y, color: currentColor })

          if (prevColor === undefined || prevColor === '') {
            newPixels.delete(key)
          } else {
            newPixels.set(key, prevColor)
          }
        }

        set({
          pixels: newPixels,
          historyIndex: state.historyIndex - 1,
        })
      },

      redo: () => {
        const state = get()
        if (state.historyIndex >= state.history.length - 1) return

        const entry = state.history[state.historyIndex + 1]
        const newPixels = new Map(state.pixels)

        // Re-apply pixels
        for (const pixel of entry.pixels) {
          const key = `${pixel.x},${pixel.y}`
          if (pixel.color === '') {
            newPixels.delete(key)
          } else {
            newPixels.set(key, pixel.color)
          }
        }

        set({
          pixels: newPixels,
          historyIndex: state.historyIndex + 1,
        })
      },

      canUndo: () => get().historyIndex >= 0,
      canRedo: () => get().historyIndex < get().history.length - 1,
    }),
    {
      name: 'pixel-art-storage',
      partialize: (state) => ({
        user: state.user,
        recentColors: state.recentColors,
        currentPalette: state.currentPalette,
      }),
    }
  )
)
