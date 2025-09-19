'use client'

import { createNote } from "@/app/actions/noteActions"
import { useTransition } from "react"

export default function CreateNoteButton() {
  const [isPending, startTransition] = useTransition()

  const handleCreateNote = () => {
    startTransition(async () => {
      try {
        await createNote()
      } catch (error) {
        console.error('Failed to create note:', error)
      }
    })
  }

  return (
    <button
      onClick={handleCreateNote}
      disabled={isPending}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Creating...' : 'New Note'}
    </button>
  )
}