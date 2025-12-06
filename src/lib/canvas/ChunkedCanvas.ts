// Chunk-based canvas storage
// Each chunk is 64x64 pixels stored as a JSON object

export const CHUNK_SIZE = 64

export interface ChunkData {
  [key: string]: string // "x,y" -> color (relative to chunk)
}

export interface Chunk {
  chunk_x: number
  chunk_y: number
  pixels: ChunkData
  updated_at?: string
}

// Get chunk coordinates from world coordinates
export function getChunkCoords(worldX: number, worldY: number): { chunkX: number; chunkY: number } {
  return {
    chunkX: Math.floor(worldX / CHUNK_SIZE),
    chunkY: Math.floor(worldY / CHUNK_SIZE),
  }
}

// Get local coordinates within a chunk
export function getLocalCoords(worldX: number, worldY: number): { localX: number; localY: number } {
  // Handle negative coordinates properly
  let localX = worldX % CHUNK_SIZE
  let localY = worldY % CHUNK_SIZE
  if (localX < 0) localX += CHUNK_SIZE
  if (localY < 0) localY += CHUNK_SIZE
  return { localX, localY }
}

// Get world coordinates from chunk + local
export function getWorldCoords(chunkX: number, chunkY: number, localX: number, localY: number): { x: number; y: number } {
  return {
    x: chunkX * CHUNK_SIZE + localX,
    y: chunkY * CHUNK_SIZE + localY,
  }
}

// Group pixels by chunk
export function groupPixelsByChunk(pixels: { x: number; y: number; color: string }[]): Map<string, { chunkX: number; chunkY: number; pixels: { localX: number; localY: number; color: string }[] }> {
  const chunks = new Map<string, { chunkX: number; chunkY: number; pixels: { localX: number; localY: number; color: string }[] }>()

  for (const pixel of pixels) {
    const { chunkX, chunkY } = getChunkCoords(pixel.x, pixel.y)
    const { localX, localY } = getLocalCoords(pixel.x, pixel.y)
    const key = `${chunkX},${chunkY}`

    if (!chunks.has(key)) {
      chunks.set(key, { chunkX, chunkY, pixels: [] })
    }
    chunks.get(key)!.pixels.push({ localX, localY, color: pixel.color })
  }

  return chunks
}

// Merge new pixels into existing chunk data
export function mergeChunkPixels(existing: ChunkData | null, newPixels: { localX: number; localY: number; color: string }[]): ChunkData {
  const result: ChunkData = existing ? { ...existing } : {}

  for (const pixel of newPixels) {
    const key = `${pixel.localX},${pixel.localY}`
    if (pixel.color === '') {
      delete result[key]
    } else {
      result[key] = pixel.color
    }
  }

  return result
}

// Convert chunk data to flat pixel array
export function chunkToPixels(chunk: Chunk): { x: number; y: number; color: string }[] {
  const pixels: { x: number; y: number; color: string }[] = []

  for (const [key, color] of Object.entries(chunk.pixels)) {
    const [localX, localY] = key.split(',').map(Number)
    const { x, y } = getWorldCoords(chunk.chunk_x, chunk.chunk_y, localX, localY)
    pixels.push({ x, y, color })
  }

  return pixels
}
