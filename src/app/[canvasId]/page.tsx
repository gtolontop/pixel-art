'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { PixelCanvas } from '@/components/canvas/PixelCanvas'
import { RemoteCursors } from '@/components/canvas/RemoteCursors'
import { Minimap } from '@/components/canvas/Minimap'
import { Timelapse } from '@/components/canvas/Timelapse'
import { ColorPicker } from '@/components/panels/ColorPicker'
import { ToolPanel } from '@/components/panels/ToolPanel'
import { UserPanel } from '@/components/panels/UserPanel'
import { MobileToolbar } from '@/components/mobile/MobileToolbar'
import { Chat } from '@/components/chat/Chat'
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
  const { sendChatMessage } = useSocket(canvasId)

  return (
    <main className="relative w-full h-screen overflow-hidden bg-neutral-100">
      <Suspense fallback={<div className="absolute inset-0 bg-neutral-100" />}>
        <PixelCanvas />
      </Suspense>

      {/* Remote cursors overlay */}
      <RemoteCursors />

      {/* Floating Panels - Desktop only */}
      <div className="hidden md:block">
        <ColorPicker />
        <ToolPanel />
        <UserPanel canvasId={canvasId} />
      </div>

      {/* Mobile Toolbar */}
      <MobileToolbar />

      {/* Canvas ID indicator */}
      <div className="absolute top-4 left-4 md:left-1/2 md:-translate-x-1/2 bg-white/80 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm flex items-center gap-2 max-w-[200px] md:max-w-none">
        <span className="text-xs text-neutral-500 hidden md:inline">Canvas:</span>
        <code className="text-xs md:text-sm font-mono text-neutral-700 truncate">{canvasId}</code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
          }}
          className="p-1 hover:bg-neutral-200 active:bg-neutral-300 rounded transition-colors flex-shrink-0"
          title="Copy link"
        >
          <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Minimap - Desktop only */}
      <Minimap />

      {/* Timelapse */}
      <Timelapse />

      {/* Chat */}
      <Chat sendMessage={sendChatMessage} />

      {/* Username Modal */}
      {!user && <UsernameModal />}
    </main>
  )
}
