'use client'

import { useState } from 'react'
import { useCanvasStore } from '@/lib/store'
import { nanoid } from 'nanoid'

export function UsernameModal() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const setUser = useCanvasStore((state) => state.setUser)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = username.trim()
    if (trimmed.length < 2) {
      setError('Username must be at least 2 characters')
      return
    }
    if (trimmed.length > 20) {
      setError('Username must be 20 characters or less')
      return
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setError('Only letters, numbers, - and _ allowed')
      return
    }

    setUser({
      id: nanoid(),
      username: trimmed,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
    })
  }

  const handleRandomName = () => {
    const adjectives = ['Happy', 'Swift', 'Brave', 'Calm', 'Wise', 'Bold', 'Cool', 'Pixel']
    const nouns = ['Artist', 'Painter', 'Creator', 'Maker', 'Wizard', 'Master', 'Pro', 'Star']
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(Math.random() * 100)
    setUsername(`${adj}${noun}${num}`)
    setError('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Welcome to Pixel Art</h2>
          <p className="text-sm text-neutral-500 mt-1">Choose a username to start drawing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError('')
              }}
              placeholder="Enter your username"
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRandomName}
              className="flex-1 px-4 py-3 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium"
            >
              Random name
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors text-sm font-medium"
            >
              Start drawing
            </button>
          </div>
        </form>

        <p className="mt-6 text-xs text-center text-neutral-400">
          Draw pixels with others in real-time
        </p>
      </div>
    </div>
  )
}
