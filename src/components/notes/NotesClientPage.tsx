'use client'

import { useState, useEffect, useRef } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import Navigation from '@/components/navigation/Navigation'
import NoteCard from '@/components/notes/NoteCard'
import CreateNoteForm from '@/components/notes/CreateNoteForm'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'
import { updateNoteOrder } from '@/app/actions/noteActions'

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
    reminder_date?: Date | null
    reminder_repeat?: string | null
    position?: number | null
  }>
}

export default function NotesClientPage({ initialNotes }: NotesClientPageProps) {
  // Sort notes: pinned notes first, then by position, then by updated_at
  const sortedInitialNotes = [...initialNotes].sort((a, b) => {
    // First priority: pinned notes come first
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    
    // Second priority: position
    const positionA = a.position ?? 999999
    const positionB = b.position ?? 999999
    if (positionA !== positionB) {
      return positionA - positionB
    }
    
    // Third priority: updated_at for notes without position
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  const [notes, setNotes] = useState(sortedInitialNotes)
  const [mounted, setMounted] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const notesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Centralized click outside logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the notes container and a note is being edited
      if (
        editingNoteId && 
        notesContainerRef.current && 
        !notesContainerRef.current.contains(event.target as Node)
      ) {
        setEditingNoteId(null)
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside)

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editingNoteId]) // Dependency on editingNoteId to re-run when it changes

  // Function to handle note creation
  const handleNoteCreated = (newNote: typeof notes[0]) => {
    setNotes(prevNotes => {
      const updatedNotes = [newNote, ...prevNotes]
      // Re-sort to maintain pinned notes at the top
      return updatedNotes.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        
        const positionA = a.position ?? 999999
        const positionB = b.position ?? 999999
        if (positionA !== positionB) {
          return positionA - positionB
        }
        
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
    })
  }

  // Function to handle note deletion from client state
  const handleNoteDeleted = (deletedNoteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== deletedNoteId))
  }

  // Function to handle note updates (like pin status changes)
  const handleNoteUpdated = (updatedNoteId: string, updates: Partial<typeof notes[0]>) => {
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => 
        note.id === updatedNoteId ? { ...note, ...updates } : note
      )
      // Re-sort to maintain pinned notes at the top
      return updatedNotes.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        
        const positionA = a.position ?? 999999
        const positionB = b.position ?? 999999
        if (positionA !== positionB) {
          return positionA - positionB
        }
        
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    // Find the notes involved in the drag operation
    const activeNote = notes.find(note => note.id === active.id)
    const overNote = notes.find(note => note.id === over.id)

    // Prevent dragging pinned notes or dropping onto pinned notes
    if (activeNote?.is_pinned || overNote?.is_pinned) {
      console.log('Cannot reorder pinned notes')
      return
    }

    const oldIndex = notes.findIndex((note) => note.id === active.id)
    const newIndex = notes.findIndex((note) => note.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newNotes = arrayMove(notes, oldIndex, newIndex)
      
      // Update local state immediately for smooth UX
      setNotes(newNotes)

      // Prepare the array for the server action with new positions
      const notesWithNewPositions = newNotes.map((note, index) => ({
        id: note.id,
        position: index
      }))

      try {
        console.log('Updating note order for', notesWithNewPositions.length, 'notes')
        // Update positions in the database
        await updateNoteOrder(notesWithNewPositions)
        console.log('Note order updated successfully')
      } catch (error) {
        console.error('Failed to update note order:', error)
        // Revert on error
        setNotes(notes)
      }
    }
  }
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
          <CreateNoteForm onNoteCreated={handleNoteCreated} />

          {/* Notes Grid */}
          {mounted ? (
            <DndContext onDragEnd={handleDragEnd}>
              <SortableContext items={notes.map(note => note.id)} strategy={rectSortingStrategy}>
                <div ref={notesContainerRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {notes.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground text-lg">
                        You have no notes yet. Create one!
                      </p>
                    </div>
                  ) : (
                    notes.map((note) => (
                      <NoteCard 
                        key={note.id} 
                        note={note} 
                        isEditing={editingNoteId === note.id}
                        onToggleEdit={setEditingNoteId}
                        onNoteDeleted={handleNoteDeleted}
                        onNoteUpdated={handleNoteUpdated}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div ref={notesContainerRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {notes.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    You have no notes yet. Create one!
                  </p>
                </div>
              ) : (
                notes.map((note) => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    isEditing={editingNoteId === note.id}
                    onToggleEdit={setEditingNoteId}
                    onNoteDeleted={handleNoteDeleted}
                    onNoteUpdated={handleNoteUpdated}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </Navigation>
    </div>
  )
}