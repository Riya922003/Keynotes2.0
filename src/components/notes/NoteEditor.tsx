"use client"

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

const BlockNoteClient = dynamic(() => import('./BlockNoteClient'), { ssr: false })

interface NoteEditorProps {
  note: {
    id: string
    title: string | null
    content: unknown
    type: 'note' | 'journal'
    created_at: Date
    updated_at: Date
    author_id: string
    workspace_id: string
  }
  titleColor?: string
  onSaved?: (updates: { title?: string; content?: string }) => void
  autoFocus?: boolean
  onEditorReady?: () => void
}

export default function NoteEditor(props: NoteEditorProps) {
  return (
    <Suspense fallback={<div className="p-4">Loading editor...</div>}>
      <BlockNoteClient {...props} />
    </Suspense>
  )
}