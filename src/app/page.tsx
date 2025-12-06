'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'

export default function Home() {
  const router = useRouter()
  const [canvasId, setCanvasId] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  const handleCreateCanvas = () => {
    const newId = nanoid(8)
    router.push(`/${newId}`)
  }

  const handleJoinCanvas = (e: React.FormEvent) => {
    e.preventDefault()
    if (canvasId.trim()) {
      // Extract canvas ID from URL if pasted
      let id = canvasId.trim()
      if (id.includes('/')) {
        const parts = id.split('/')
        id = parts[parts.length - 1]
      }
      router.push(`/${id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-neutral-800">Pixel Art</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero section */}
          <div className="text-center py-12 md:py-20">
            <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-4">
              Dessine en <span className="text-blue-500">temps réel</span>
            </h2>
            <p className="text-lg text-neutral-600 max-w-md mx-auto">
              Crée ou rejoins un canvas collaboratif et dessine avec tes amis, en direct.
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Create canvas card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Créer un canvas
              </h3>
              <p className="text-neutral-600 mb-6">
                Démarre un nouveau canvas et invite tes amis à te rejoindre.
              </p>
              <button
                onClick={handleCreateCanvas}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors"
              >
                Nouveau canvas
              </button>
            </div>

            {/* Join canvas card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Rejoindre un canvas
              </h3>
              <p className="text-neutral-600 mb-4">
                Entre le code ou colle le lien d'un canvas existant.
              </p>
              <form onSubmit={handleJoinCanvas}>
                <input
                  type="text"
                  value={canvasId}
                  onChange={(e) => setCanvasId(e.target.value)}
                  placeholder="Code ou lien du canvas"
                  className="w-full px-4 py-3 bg-neutral-100 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-green-300"
                />
                <button
                  type="submit"
                  disabled={!canvasId.trim()}
                  className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 active:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Rejoindre
                </button>
              </form>
            </div>
          </div>

          {/* Mobile QR section */}
          <div className="md:hidden mt-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Scanner un QR code
              </h3>
              <p className="text-neutral-600 mb-4">
                Scanne le QR code d'un ami pour rejoindre son canvas instantanément.
              </p>
              <button
                onClick={() => {
                  // Open camera for QR scan - using native camera app
                  if (navigator.mediaDevices) {
                    alert('Ouvre ton app Appareil Photo et scanne le QR code!')
                  }
                }}
                className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 active:bg-purple-700 transition-colors"
              >
                Ouvrir la caméra
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🎨</div>
              <div className="text-sm font-medium text-neutral-700">Palettes de couleurs</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm font-medium text-neutral-700">Temps réel</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">💬</div>
              <div className="text-sm font-medium text-neutral-700">Chat intégré</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">📱</div>
              <div className="text-sm font-medium text-neutral-700">Mobile friendly</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
