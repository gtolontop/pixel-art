'use client'

import { useEffect } from 'react'
import { useCanvasStore } from '@/lib/store'

export function useKeyboardShortcuts() {
  const setTool = useCanvasStore((state) => state.setTool)
  const brushSize = useCanvasStore((state) => state.brushSize)
  const setBrushSize = useCanvasStore((state) => state.setBrushSize)
  const undo = useCanvasStore((state) => state.undo)
  const redo = useCanvasStore((state) => state.redo)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Undo/Redo with Ctrl/Cmd
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
          return
        }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault()
          redo()
          return
        }
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
  }, [setTool, brushSize, setBrushSize, undo, redo])
}
