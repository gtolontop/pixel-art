export type Tool = 'brush' | 'eraser' | 'eyedropper'

export interface User {
  id: string
  username: string
  color: string
}

export interface Pixel {
  x: number
  y: number
  color: string
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export interface Chunk {
  x: number
  y: number
  pixels: Map<string, string> // key: "x,y" local to chunk, value: color
}

export const CHUNK_SIZE = 64
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 40
export const DEFAULT_ZOOM = 10

export const PRESET_COLORS = [
  '#FFFFFF', '#E4E4E4', '#888888', '#222222',
  '#FFA7D1', '#E50000', '#E59500', '#A06A42',
  '#E5D900', '#94E044', '#02BE01', '#00D3DD',
  '#0083C7', '#0000EA', '#CF6EE4', '#820080',
]
