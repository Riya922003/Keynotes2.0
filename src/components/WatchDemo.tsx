"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function WatchDemo() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded bg-muted text-foreground hover:bg-muted/80 transition"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v14l11-7z" />
        </svg>
        Watch Demo
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full rounded-lg bg-muted/30 shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 inline-flex items-center justify-center h-9 w-9 rounded-full bg-muted/60 hover:bg-muted/80 text-foreground"
              aria-label="Close demo"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-4">
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <Image src="/assets/Gif/keynotes.gif" alt="Keynotes demo" fill className="object-contain rounded" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
