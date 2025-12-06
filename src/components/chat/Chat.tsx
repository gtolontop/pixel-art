'use client'

import { useState, useRef, useEffect } from 'react'
import { useCanvasStore } from '@/lib/store'
import clsx from 'clsx'

interface ChatProps {
  sendMessage: (text: string) => void
}

export function Chat({ sendMessage }: ChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chatMessages = useCanvasStore((state) => state.chatMessages)
  const isChatOpen = useCanvasStore((state) => state.isChatOpen)
  const setChatOpen = useCanvasStore((state) => state.setChatOpen)
  const unreadMessages = useCanvasStore((state) => state.unreadMessages)
  const user = useCanvasStore((state) => state.user)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isChatOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && user) {
      sendMessage(input)
      setInput('')
    }
  }

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setChatOpen(!isChatOpen)}
        className={clsx(
          'fixed bottom-20 md:bottom-4 left-4 z-40 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center transition-colors',
          isChatOpen ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600'
        )}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unreadMessages > 0 && !isChatOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadMessages > 9 ? '9+' : unreadMessages}
          </div>
        )}
      </button>

      {/* Chat panel */}
      {isChatOpen && (
        <div className="fixed bottom-20 md:bottom-4 left-4 z-40 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-neutral-200 flex flex-col max-h-[60vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <span className="font-semibold">Chat</span>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1 hover:bg-neutral-100 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
            {chatMessages.length === 0 ? (
              <div className="text-center text-neutral-400 text-sm py-8">
                Aucun message
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div
                  key={`${msg.timestamp}-${i}`}
                  className={clsx(
                    'flex flex-col',
                    msg.visibleId === 'self' ? 'items-end' : 'items-start'
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: msg.color }}
                    />
                    <span className="text-xs font-medium text-neutral-500">
                      {msg.visibleId === 'self' ? 'Vous' : msg.username}
                    </span>
                  </div>
                  <div
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-sm max-w-[80%]',
                      msg.visibleId === 'self'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-800'
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={user ? "Message..." : "Choisissez un pseudo d'abord"}
                disabled={!user}
                className="flex-1 px-3 py-2 bg-neutral-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!user || !input.trim()}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
