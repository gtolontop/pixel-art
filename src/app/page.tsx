'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'

export default function Home() {
  const router = useRouter()
  const [canvasId, setCanvasId] = useState('')

  const handleCreateCanvas = () => {
    const newId = nanoid(8)
    router.push(`/${newId}`)
  }

  const handleJoinCanvas = (e: React.FormEvent) => {
    e.preventDefault()
    if (canvasId.trim()) {
      let id = canvasId.trim()
      if (id.includes('/')) {
        const parts = id.split('/')
        id = parts[parts.length - 1]
      }
      router.push(`/${id}`)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-semibold text-neutral-900">Pixel Art</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-lg mx-auto px-6 py-12 w-full">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Canvas collaboratif
            </h1>
            <p className="text-neutral-500">
              Dessine en temps réel avec tes amis
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-6">
            {/* Create */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <h2 className="font-medium text-neutral-900 mb-1">Nouveau canvas</h2>
              <p className="text-sm text-neutral-500 mb-4">
                Crée un espace de dessin et partage le lien
              </p>
              <button
                onClick={handleCreateCanvas}
                className="w-full py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                Créer
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-neutral-200" />
              <span className="text-sm text-neutral-400">ou</span>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

            {/* Join */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <h2 className="font-medium text-neutral-900 mb-1">Rejoindre</h2>
              <p className="text-sm text-neutral-500 mb-4">
                Entre un code ou colle un lien
              </p>
              <form onSubmit={handleJoinCanvas} className="space-y-3">
                <input
                  type="text"
                  value={canvasId}
                  onChange={(e) => setCanvasId(e.target.value)}
                  placeholder="Code ou lien du canvas"
                  className="w-full px-4 py-2.5 bg-neutral-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
                <button
                  type="submit"
                  disabled={!canvasId.trim()}
                  className="w-full py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Rejoindre
                </button>
              </form>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 pt-8 border-t border-neutral-200">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-sm font-medium text-neutral-700">Temps réel</div>
                <div className="text-xs text-neutral-400 mt-0.5">Multi-joueurs</div>
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-700">Chat</div>
                <div className="text-xs text-neutral-400 mt-0.5">Intégré</div>
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-700">Mobile</div>
                <div className="text-xs text-neutral-400 mt-0.5">Responsive</div>
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-700">QR Code</div>
                <div className="text-xs text-neutral-400 mt-0.5">Partage facile</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
