'use client'

import { useState, createContext, useContext } from 'react'
import { QRCodeSVG } from 'qrcode.react'

// Context for opening share modal from anywhere
const ShareContext = createContext<{ open: () => void }>({ open: () => {} })
export const useShareModal = () => useContext(ShareContext)

interface ShareModalProps {
  canvasId: string
}

export function ShareModal({ canvasId }: ShareModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const openModal = () => setIsOpen(true)
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${canvasId}`
    : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pixel Art Canvas',
          text: `Rejoins-moi sur ce canvas pixel art!`,
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopy()
    }
  }

  return (
    <>
      {/* Share button - positioned differently on mobile vs desktop */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-30 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors hidden md:flex"
        title="Partager"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 m-4 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Partager le canvas</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-4 p-4 bg-white rounded-xl border-2 border-neutral-100">
              <QRCodeSVG
                value={shareUrl}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* URL */}
            <div className="mb-4">
              <label className="text-xs text-neutral-500 mb-1 block">Lien du canvas</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-neutral-100 rounded-lg text-sm font-mono truncate"
                />
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-neutral-900 text-white hover:bg-neutral-800'
                  }`}
                >
                  {copied ? 'Copié!' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Share button (mobile) */}
            <button
              onClick={handleShare}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Partager
            </button>

            {/* Canvas ID */}
            <p className="text-center text-xs text-neutral-400 mt-4">
              Canvas ID: <code className="bg-neutral-100 px-1.5 py-0.5 rounded">{canvasId}</code>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
