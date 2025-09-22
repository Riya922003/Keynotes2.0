"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRecentNotes } from '@/app/actions/noteActions'

type Note = any

export default function RecentNotes() {
  const [notes, setNotes] = useState<Note[]>([])

  const fetchNotes = async () => {
    try {
      const res = await getRecentNotes()
      setNotes(res ?? [])
    } catch (err) {
      console.error('Failed to fetch recent notes:', err)
      setNotes([])
    }
  }

  useEffect(() => {
    fetchNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handler = () => {
      fetchNotes()
    }

    window.addEventListener('notesUpdated', handler)

    return () => {
      window.removeEventListener('notesUpdated', handler)
    }
  }, [])

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Recent Notes</h3>

      {notes.length === 0 ? (
        <p className="text-xs text-muted-foreground">No recent notes.</p>
      ) : (
        <div className="grid gap-2">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`} className="block p-3 bg-white dark:bg-slate-800 rounded-md shadow-sm hover:shadow focus:shadow">
              <div className="text-sm font-medium">{note.title || 'Untitled'}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
