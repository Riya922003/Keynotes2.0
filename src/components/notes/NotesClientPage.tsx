'use client'

import { useState, useEffect, useRef } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { Pin } from 'lucide-react'
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
  // Don't sort initially - maintain original order and handle pinned/unpinned separately
  const [notes, setNotes] = useState(initialNotes)
  const [mounted, setMounted] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const notesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Centralized click outside logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Don't close if clicking inside the reminder modal
      if (target.closest('[data-reminder-modal="true"]')) {
        return
      }
      
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
    setNotes(prevNotes => [newNote, ...prevNotes])
  }

  // Function to handle note deletion from client state
  const handleNoteDeleted = (deletedNoteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== deletedNoteId))
  }

  // Function to handle note updates (like pin status changes)
  const handleNoteUpdated = (updatedNoteId: string, updates: Partial<typeof notes[0]>) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === updatedNoteId ? { ...note, ...updates } : note
      )
    )
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
        // Update positions in the database
        await updateNoteOrder(notesWithNewPositions)
      } catch (error) {
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

          {/* Notes Layout - Separate Pinned and Unpinned */}
          {mounted ? (
            <DndContext onDragEnd={handleDragEnd}>
              <SortableContext items={notes.filter(note => !note.is_pinned).map(note => note.id)} strategy={rectSortingStrategy}>
                <div ref={notesContainerRef} className="space-y-6">
                  {notes.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground text-lg">
                        You have no notes yet. Create one!
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Pinned Notes Section */}
                      {notes.some(note => note.is_pinned) && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Pin className="w-4 h-4 text-yellow-600" />
                            <h2 className="text-lg font-semibold text-muted-foreground">Pinned Notes</h2>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-all duration-300 ease-in-out">
                            {notes
                              .filter(note => note.is_pinned)
                              .map((note, index) => (
                                <div 
                                  key={note.id}
                                  className="transition-all duration-300 ease-in-out transform"
                                  style={{
                                    transitionProperty: 'transform, opacity',
                                    transitionDelay: `${index * 50}ms`,
                                  }}
                                >
                                  <NoteCard 
                                    note={note} 
                                    isEditing={editingNoteId === note.id}
                                    onToggleEdit={setEditingNoteId}
                                    onNoteDeleted={handleNoteDeleted}
                                    onNoteUpdated={handleNoteUpdated}
                                  />
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}

                      {/* Unpinned Notes Section */}
                      {notes.some(note => !note.is_pinned) && (
                        <div className="space-y-4">
                          {notes.some(note => note.is_pinned) && (
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-semibold text-muted-foreground">Other Notes</h2>
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-all duration-300 ease-in-out">
                            {notes
                              .filter(note => !note.is_pinned)
                              .map((note, index) => (
                                <div 
                                  key={note.id}
                                  className="transition-all duration-300 ease-in-out transform"
                                  style={{
                                    transitionProperty: 'transform, opacity',
                                    transitionDelay: `${index * 50}ms`,
                                  }}
                                >
                                  <NoteCard 
                                    note={note} 
                                    isEditing={editingNoteId === note.id}
                                    onToggleEdit={setEditingNoteId}
                                    onNoteDeleted={handleNoteDeleted}
                                    onNoteUpdated={handleNoteUpdated}
                                  />
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div ref={notesContainerRef} className="space-y-6">
              {notes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    You have no notes yet. Create one!
                  </p>
                </div>
              ) : (
                <>
                  {/* Pinned Notes Section */}
                  {notes.some(note => note.is_pinned) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Pin className="w-4 h-4 text-yellow-600" />
                        <h2 className="text-lg font-semibold text-muted-foreground">Pinned Notes</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-all duration-300 ease-in-out">
                        {notes
                          .filter(note => note.is_pinned)
                          .map((note, index) => (
                            <div 
                              key={note.id}
                              className="transition-all duration-300 ease-in-out transform"
                              style={{
                                transitionProperty: 'transform, opacity',
                                transitionDelay: `${index * 50}ms`,
                              }}
                            >
                              <NoteCard 
                                note={note} 
                                isEditing={editingNoteId === note.id}
                                onToggleEdit={setEditingNoteId}
                                onNoteDeleted={handleNoteDeleted}
                                onNoteUpdated={handleNoteUpdated}
                              />
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Unpinned Notes Section */}
                  {notes.some(note => !note.is_pinned) && (
                    <div className="space-y-4">
                      {notes.some(note => note.is_pinned) && (
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold text-muted-foreground">Other Notes</h2>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-all duration-300 ease-in-out">
                        {notes
                          .filter(note => !note.is_pinned)
                          .map((note, index) => (
                            <div 
                              key={note.id}
                              className="transition-all duration-300 ease-in-out transform"
                              style={{
                                transitionProperty: 'transform, opacity',
                                transitionDelay: `${index * 50}ms`,
                              }}
                            >
                              <NoteCard 
                                note={note} 
                                isEditing={editingNoteId === note.id}
                                onToggleEdit={setEditingNoteId}
                                onNoteDeleted={handleNoteDeleted}
                                onNoteUpdated={handleNoteUpdated}
                              />
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Navigation>
    </div>
  )
}