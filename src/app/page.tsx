'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Generate a new canvas ID and redirect
    const canvasId = nanoid(8)
    router.replace(`/${canvasId}`)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-neutral-600">Creating new canvas...</p>
      </div>
    </div>
  )
}
