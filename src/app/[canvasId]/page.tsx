'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { PixelCanvas } from '@/components/canvas/PixelCanvas'
import { ColorPicker } from '@/components/panels/ColorPicker'
import { ToolPanel } from '@/components/panels/ToolPanel'
import { UserPanel } from '@/components/panels/UserPanel'
import { UsernameModal } from '@/components/ui/UsernameModal'
import { useCanvasStore } from '@/lib/store'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { usePixelSync } from '@/hooks/usePixelSync'
import { useSocket } from '@/hooks/useSocket'

export default function CanvasPage() {
  const params = useParams()
  const canvasId = params.canvasId as string

  const user = useCanvasStore((state) => state.user)
  useKeyboardShortcuts()
  usePixelSync(canvasId)
  useSocket(canvasId)

  return (
    <main className="relative w-full h-screen overflow-hidden bg-neutral-100">
      <Suspense fallback={<div className="absolute inset-0 bg-neutral-100" />}>
        <PixelCanvas />
      </Suspense>

      {/* Floating Panels */}
      <ColorPicker />
      <ToolPanel />
      <UserPanel canvasId={canvasId} />

      {/* Canvas ID indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
        <span className="text-xs text-neutral-500">Canvas:</span>
        <code className="text-sm font-mono text-neutral-700">{canvasId}</code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
          }}
          className="ml-2 p-1 hover:bg-neutral-200 rounded transition-colors"
          title="Copy link"
        >
          <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Username Modal */}
      {!user && <UsernameModal />}
    </main>
  )
}
