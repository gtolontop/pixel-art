'use client'

import { useEffect } from 'react'
import { useCanvasStore } from '@/lib/store'

export function useKeyboardShortcuts() {
  const setTool = useCanvasStore((state) => state.setTool)
  const brushSize = useCanvasStore((state) => state.brushSize)
  const setBrushSize = useCanvasStore((state) => state.setBrushSize)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'b':
          setTool('brush')
          break
        case 'e':
          setTool('eraser')
          break
        case 'i':
          setTool('eyedropper')
          break
        case '[':
          setBrushSize(brushSize - 1)
          break
        case ']':
          setBrushSize(brushSize + 1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setTool, brushSize, setBrushSize])
}
