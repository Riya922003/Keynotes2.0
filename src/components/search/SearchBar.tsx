"use client"

import React, { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChangeAction: (value: string) => void
}

export default function SearchBar({ value, onChangeAction }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Keyboard shortcut: press '/' to focus the search input (when not typing in an input)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore modifier keys and when target is editable
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (!target) return
      const tag = target.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return
      try {
        inputRef.current?.focus()
        e.preventDefault()
      } catch {}
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const clear = () => {
    onChangeAction('')
    try { inputRef.current?.focus() } catch {}
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeAction(e.target.value)}
        placeholder="Search..."
        className="pl-10 pr-9"
        aria-label="Search"
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded hover:bg-muted"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
