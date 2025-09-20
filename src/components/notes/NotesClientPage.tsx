'use client'

import { useState } from 'react'
import Navigation from '@/components/navigation/Navigation'
import NoteCard from '@/components/notes/NoteCard'
import CreateNoteForm from '@/components/notes/CreateNoteForm'
import NoteEditorModal from '@/components/notes/NoteEditorModal'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'

interface NotesClientPageProps {
  initialNotes: Array<{
    id: string
    title: string | null
    content: unknown
    type: 'note' | 'journal'
    created_at: Date
    updated_at: Date
    author_id: string
    workspace_id: string
    color?: string | null
    is_pinned?: boolean | null
    is_archived?: boolean | null
  }>
}

export default function NotesClientPage({ initialNotes }: NotesClientPageProps) {
  const [editingNote, setEditingNote] = useState<NotesClientPageProps['initialNotes'][0] | null>(null)

  return (
    <div className="fixed inset-0 bg-background">
      {/* Top Right Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggleButton />
      </div>
      
      <Navigation>
        <div className="space-y-6">
          {/* Static Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Notes</h1>
          </div>

          {/* Create Note Form */}
          <CreateNoteForm />

          {/* Notes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {initialNotes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">
                  You have no notes yet. Create one!
                </p>
              </div>
            ) : (
              initialNotes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onEdit={() => setEditingNote(note)}
                />
              ))
            )}
          </div>
        </div>
      </Navigation>

      {/* Note Editor Modal */}
      <NoteEditorModal 
        note={editingNote} 
        onClose={() => setEditingNote(null)} 
      />
    </div>
  )
}