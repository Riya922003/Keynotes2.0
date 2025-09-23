 'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { useRouter } from 'next/navigation'
import { matchSorter } from 'match-sorter'
import Navigation from '@/components/navigation/Navigation'
import NoteCard from '@/components/notes/NoteCard'
import CreateNoteForm from '@/components/notes/CreateNoteForm'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'
import { updateNoteOrder } from '@/app/actions/noteActions'
// Note: drag-and-drop ordering has been removed from this component so sorting/searching can be handled client-side

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
  sharedNotes?: Array<{
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

// Local note types used across the component
type Note = NotesClientPageProps['initialNotes'][number]
// GroupedNotes type intentionally removed; we infer structure from returned object in useMemo

export default function NotesClientPage({ initialNotes, sharedNotes: initialShared }: NotesClientPageProps) {
  // Don't sort initially - maintain original order and handle pinned/unpinned separately
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [sharedNotes, setSharedNotes] = useState<Note[]>(initialShared || [])
  const [searchQuery, setSearchQuery] = useState('')
  // mounted state not used; removed to satisfy lint
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [autoFocusNoteId, setAutoFocusNoteId] = useState<string | null>(null)
  const notesContainerRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  // (no-op) keep mount logic earlier; skip debug warnings in production

  // Ensure client state is populated from server props on mount in case of hydration mismatch
  useEffect(() => {
    if ((!notes || notes.length === 0) && initialNotes && initialNotes.length > 0) {
      setNotes(initialNotes)
    }
    if ((!sharedNotes || sharedNotes.length === 0) && initialShared && initialShared.length > 0) {
      setSharedNotes(initialShared)
    }
    // We only want to run this on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Centralized click outside logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Don't close if clicking inside the reminder modal
      if (target.closest('[data-reminder-modal="true"]')) {
        return
      }
      
      // Don't close if clicking inside the note editor modal
      if (target.closest('[data-note-editor-modal="true"]')) {
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
  const handleNoteCreated = (newNote: Note) => {
    // Clear any active search so the new note appears in the default list
    setSearchQuery('')

    // Remove q param from URL (keep other params)
    try {
      const params = new URLSearchParams(searchParams?.toString() || '')
      params.delete('q')
      const url = `${typeof window !== 'undefined' ? window.location.pathname : '/notes'}?${params.toString()}`
      router.replace(url)
    } catch {}

  // Prepend the new note to the client list
  setNotes((prevNotes: Note[]) => [newNote, ...prevNotes])

  // Open the note editor for the newly created note and request autofocus
  setEditingNoteId(newNote.id)
  setAutoFocusNoteId(newNote.id)
  // Clear the auto focus marker after a short delay so it won't re-trigger later
  setTimeout(() => setAutoFocusNoteId(null), 1500)

    // Scroll the notes container to the top so the created note is visible
    setTimeout(() => {
      try {
        if (notesContainerRef.current) {
          notesContainerRef.current.scrollTop = 0
          // If first child exists, ensure it's visible
          const first = notesContainerRef.current.querySelector('[data-note-id]') as HTMLElement | null
          if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      } catch {}
    }, 50)
  }

  // Subscribe to server-sent events for real-time updates
  useEffect(() => {
    if (typeof window === 'undefined') return
    let es: EventSource | null = null
    try {
      es = new EventSource('/api/realtime/notes')
      es.addEventListener('notesUpdated', async (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data || '{}')
          // Handle enriched payloads locally to avoid fetching full lists
          switch (payload.type) {
            case 'noteCreated': {
              const note = payload.note
              if (note) setNotes((prev) => [note, ...prev])
              break
            }
            case 'noteUpdated': {
              const note = payload.note
              if (note) {
                setNotes((prev) => prev.map(n => n.id === note.id ? note : n))
                setSharedNotes((prev) => prev.map(n => n.id === note.id ? note : n))
              }
              break
            }
            case 'noteDeleted': {
              const id = payload.noteId
              if (id) {
                setNotes((prev) => prev.filter(n => n.id !== id))
                setSharedNotes((prev) => prev.filter(n => n.id !== id))
              }
              break
            }
            case 'collaboratorAdded': {
              // If the current user is the new collaborator, add to sharedNotes if included
              // For now, rely on payload.documentId and optimistic update isn't performed here
              // Fall back to refetching the shared list for accurate data
              try {
                const res = await fetch('/api/notes/list')
                if (!res.ok) break
                const data = await res.json()
                if (data.sharedNotes) setSharedNotes(data.sharedNotes)
              } catch {}
              break
            }
            case 'collaboratorRemoved': {
              // If collaborator removed, ensure removed note is not in sharedNotes
              const { documentId, removedUserId } = payload
              try {
                // If current client is the user removed, remove from sharedNotes
                // We don't know current user's id on client easily; safest is to refetch shared list
                const res = await fetch('/api/notes/list')
                if (!res.ok) break
                const data = await res.json()
                if (data.sharedNotes) setSharedNotes(data.sharedNotes)
              } catch {}
              break
            }
            default: {
              // Unknown payload: conservative approach — refresh lists
              try {
                const res = await fetch('/api/notes/list')
                if (!res.ok) return
                const data = await res.json()
                if (data.ownedNotes) setNotes(data.ownedNotes)
                if (data.sharedNotes) setSharedNotes(data.sharedNotes)
              } catch {}
            }
          }
        } catch {
          // On parse error, fallback to full fetch
          try {
            const res = await fetch('/api/notes/list')
            if (!res.ok) return
            const data = await res.json()
            if (data.ownedNotes) setNotes(data.ownedNotes)
            if (data.sharedNotes) setSharedNotes(data.sharedNotes)
          } catch {}
        }
      })

      // Fallback to generic message: refresh lists
      es.onmessage = async () => {
        try {
          const res = await fetch('/api/notes/list')
          if (!res.ok) return
          const data = await res.json()
          if (data.ownedNotes) setNotes(data.ownedNotes)
          if (data.sharedNotes) setSharedNotes(data.sharedNotes)
        } catch {}
      }
    } catch {
      // If EventSource is unavailable, gracefully degrade to polling
      let mounted = true
      const fetchList = async () => {
        try {
          const res = await fetch('/api/notes/list')
          if (!res.ok) return
          const data = await res.json()
          if (!mounted) return
          if (data.ownedNotes) setNotes(data.ownedNotes)
          if (data.sharedNotes) setSharedNotes(data.sharedNotes)
        } catch {}
      }
      fetchList()
      const id = setInterval(fetchList, 5000)
      return () => { mounted = false; clearInterval(id) }
    }

    return () => {
      try { es?.close() } catch {}
    }
  }, [])

  // Function to handle note deletion from client state
  const handleNoteDeleted = (deletedNoteId: string) => {
    setNotes((prevNotes: Note[]) => prevNotes.filter((note: Note) => note.id !== deletedNoteId))
  }

  // Function to handle note updates (like pin status changes)
  const handleNoteUpdated = (updatedNoteId: string, updates: Partial<Note>) => {
    setNotes((prevNotes: Note[]) => {
      // If the update marks the note as archived, remove it from the current list
      if (updates.is_archived) {
        return prevNotes.filter((note: Note) => note.id !== updatedNoteId)
      }
      return prevNotes.map((note: Note) => 
        note.id === updatedNoteId ? { ...note, ...updates } : note
      )
    })
  }

  // Drag-and-drop handlers removed in favor of client-side sorting and searching
  // We keep local search state (controlled SearchBar) so searching doesn't require modifying the URL
  // still expose useSearchParams for other uses if needed
  const searchParams = useSearchParams()
  const initialQ = searchParams?.get('q') ?? ''

  useEffect(() => {
    // initialize local query from URL on mount and keep it in sync when the URL changes
    // (set even when empty so clearing the search in the sidebar updates the page)
    setSearchQuery(initialQ)
    setIsMounted(true)
  }, [initialQ])

  const router = useRouter()

  // Sync searchQuery to URL q param whenever it changes (replace so history isn't cluttered)
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (searchQuery) params.set('q', searchQuery)
    else params.delete('q')
    const url = `${typeof window !== 'undefined' ? window.location.pathname : '/notes'}?${params.toString()}`
    router.replace(url)
  }, [searchQuery, router, searchParams])

  const grouped = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    // Local note type
    type Note = NotesClientPageProps['initialNotes'][number]
    type NoteWithMatch = Note & { matchCount?: number }

    // Helper to extract searchable text from content
    const extractText = (content: unknown) => {
      try {
        if (!content) return ''
        if (typeof content === 'string') {
          try {
            const parsed = JSON.parse(content)
            if (Array.isArray(parsed)) {
              return parsed
                .map((block: unknown) => {
                  const b = block as { content?: unknown }
                  if (!b.content) return ''
                  if (typeof b.content === 'string') return b.content
                  if (Array.isArray(b.content)) return (b.content as Array<{ text?: string }>).map((c) => (c && typeof c.text === 'string' ? c.text : '')).join('')
                  return ''
                })
                .join(' ')
            }
          } catch {
            return content
          }
        }
        if (Array.isArray(content)) {
          return content
            .map((block: unknown) => {
              const b = block as { content?: unknown }
              if (!b.content) return ''
              if (typeof b.content === 'string') return b.content
              if (Array.isArray(b.content)) return (b.content as Array<{ text?: string }>).map((c) => (c && typeof c.text === 'string' ? c.text : '')).join('')
              return ''
            })
            .join(' ')
        }
        return ''
      } catch {
        return ''
      }
    }

    // Partition notes into pinned, matches, and rest maintaining relative order within groups
  const pinned: NoteWithMatch[] = []
  const matches: NoteWithMatch[] = []
  const rest: NoteWithMatch[] = []

    // Separate pinned and unpinned first
    const unpinned = notes.filter(n => !n.is_pinned)
    for (const note of notes) {
      if (note.is_pinned) pinned.push(note)
    }

    if (!query) {
      // No search: keep original relative order
      rest.push(...unpinned)
      return { pinned, matches, rest, all: [...pinned, ...rest] }
    }

    // Use matchSorter to rank all notes fuzzily
    const rankedAll = matchSorter<Note>(notes as Note[], query, {
      keys: ['title', (item: Note) => extractText(item.content)],
    }) as Note[]

    // Build rank index map so earlier items have higher contribution
    const rankIndex = new Map<string, number>()
    rankedAll.forEach((n, i) => rankIndex.set(n.id, i))

    // compute match counts and base fuzzy score
    const terms = query.split(/\s+/).filter(Boolean)
    const matchCountMap = new Map<string, number>()
    const fuzzyScoreMap = new Map<string, number>()
    for (const n of notes) {
      const hay = (n.title || '') + ' ' + extractText(n.content)
      const lower = hay.toLowerCase()
      let count = 0
      for (const t of terms) {
        const tn = t.toLowerCase()
        let idx = lower.indexOf(tn)
        while (idx !== -1) {
          count++
          idx = lower.indexOf(tn, idx + tn.length)
        }
      }
  matchCountMap.set(n.id, count)
      const idx = rankIndex.has(n.id) ? rankIndex.get(n.id)! : rankedAll.length
      // higher fuzzy score for earlier rank (invert index)
      fuzzyScoreMap.set(n.id, Math.max(0, rankedAll.length - idx))
    }

    // Weighted ranking: pinned weight + fuzzy score + title bonus + match count
    const PIN_WEIGHT = 200
    const TITLE_BONUS = 50

    // Build combined ranking using notes with matchCount attached
    const combined = notes.map(n => {
      const fuzzy = fuzzyScoreMap.get(n.id) ?? 0
      const count = matchCountMap.get(n.id) ?? 0
      const noteWithMatch: NoteWithMatch = { ...(n as Note), matchCount: count }
      const title = (n.title || '').toLowerCase()
      const isTitleMatch = terms.some(t => title.includes(t)) ? TITLE_BONUS : 0
      const pin = n.is_pinned ? PIN_WEIGHT : 0
      const score = pin + fuzzy + isTitleMatch + count
      return { note: noteWithMatch, score }
    }).sort((a, b) => b.score - a.score)

    // Build ordered arrays
    const combinedNotes = combined.map(c => c.note)
    // split combinedNotes into matches (count>0) and rest
    for (const n of combinedNotes) {
      const note = n as NoteWithMatch
      if ((note.matchCount ?? 0) > 0) matches.push(note)
      else rest.push(note)
    }

    return { pinned, matches, rest, combined: combinedNotes, all: combinedNotes }
  }, [notes, searchQuery])

  // Drag end - only allow reordering within the same group (pinned vs unpinned)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeIndex = notes.findIndex(n => n.id === active.id)
    const overIndex = notes.findIndex(n => n.id === over.id)
    if (activeIndex === -1 || overIndex === -1) return

    const activeNote = notes[activeIndex]
    const overNote = notes[overIndex]

    const activeGroup = Boolean(activeNote.is_pinned)
    const overGroup = Boolean(overNote.is_pinned)

    // Only allow reordering within the same group
    if (activeGroup !== overGroup) return

    // Compute new notes array with the moved item
    const newNotes = arrayMove(notes, activeIndex, overIndex)
    setNotes(newNotes)

    // Persist new positions (using overall index as position)
    const notesWithNewPositions = newNotes.map((note, idx) => ({ id: note.id, position: idx }))

    try {
      await updateNoteOrder(notesWithNewPositions)
    } catch {
      // Revert on error
      setNotes(notes)
    }
  }

  return (
    <div className="fixed inset-0 bg-background">
      {/* debug UI removed */}

      {/* Top Right Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggleButton />
      </div>

      <Navigation>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Notes</h1>
          </div>

          {/* Create Note Form */}
          <CreateNoteForm onNoteCreated={handleNoteCreated} />

          {/* Notes grid (pinned, search results, other notes) */}
          <div ref={notesContainerRef} className="space-y-6" suppressHydrationWarning>
            {/* Shared notes section (notes shared with the current user) */}
            {sharedNotes && sharedNotes.length > 0 && (
              <div>
                <h3 className="px-2 text-xs text-muted-foreground">Shared with you</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sharedNotes.filter((s) => s && s.id).map((n: any, idx: number) => (
                    <div key={n.id ?? `shared-${idx}`} data-note-id={n.id}>
                      <NoteCard
                        note={n}
                        isEditing={editingNoteId === n.id}
                        onToggleEdit={setEditingNoteId}
                        onNoteDeleted={handleNoteDeleted}
                        onNoteUpdated={handleNoteUpdated}
                        highlight={searchQuery}
                        matchCount={0}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {notes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">You have no notes yet. Create one!</p>
              </div>
            ) : (
              isMounted ? (
                <DndContext onDragEnd={handleDragEnd}>
                  <section className="space-y-3">
                    {searchQuery ? (
                      // Searching: show only notes that actually match the query
                      <div>
                        <h3 className="px-2 text-xs text-muted-foreground">Results</h3>
                        {(!grouped.matches || grouped.matches.length === 0) ? (
                          <div className="px-2 py-6 text-sm text-muted-foreground">No results</div>
                        ) : (
                          <SortableContext items={(grouped.matches || []).map(n => n.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {(grouped.matches || []).map(n => (
                                <div key={n.id} data-note-id={n.id}>
                                  <NoteCard
                                    note={n}
                                    isEditing={editingNoteId === n.id}
                                    onToggleEdit={setEditingNoteId}
                                    onNoteDeleted={handleNoteDeleted}
                                    onNoteUpdated={handleNoteUpdated}
                                    highlight={searchQuery}
                                    matchCount={n.matchCount}
                                    autoFocus={autoFocusNoteId === n.id}
                                  />
                                </div>
                              ))}
                            </div>
                          </SortableContext>
                        )}
                      </div>
                    ) : (
                      // Not searching: show pinned then other notes
                      <div>
                        {grouped.pinned.length > 0 && (
                          <section className="mb-6">
                            <h3 className="px-2 text-xs text-muted-foreground">Pinned</h3>
                            <SortableContext items={grouped.pinned.map(n => n.id)} strategy={rectSortingStrategy}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {grouped.pinned.map(n => (
                                  <div key={n.id} data-note-id={n.id}>
                                    <NoteCard
                                      note={n}
                                      isEditing={editingNoteId === n.id}
                                      onToggleEdit={setEditingNoteId}
                                      onNoteDeleted={handleNoteDeleted}
                                      onNoteUpdated={handleNoteUpdated}
                                      highlight={searchQuery}
                                      matchCount={n.matchCount}
                                      autoFocus={autoFocusNoteId === n.id}
                                    />
                                  </div>
                                ))}
                              </div>
                            </SortableContext>
                          </section>
                        )}

                        {grouped.rest.length > 0 && (
                          <section>
                            <h3 className="px-2 text-sm font-medium text-muted-foreground">All notes</h3>
                            <SortableContext items={grouped.rest.map(n => n.id)} strategy={rectSortingStrategy}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {grouped.rest.map(n => (
                                  <div key={n.id} data-note-id={n.id}>
                                    <NoteCard
                                      note={n}
                                      isEditing={editingNoteId === n.id}
                                      onToggleEdit={setEditingNoteId}
                                      onNoteDeleted={handleNoteDeleted}
                                      onNoteUpdated={handleNoteUpdated}
                                      autoFocus={autoFocusNoteId === n.id}
                                    />
                                  </div>
                                ))}
                              </div>
                            </SortableContext>
                          </section>
                        )}
                      </div>
                    )}
                  </section>
                </DndContext>
              ) : (
                // Non-interactive fallback during SSR / before client mount
                <section className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {notes.map(n => (
                      <div key={n.id} className="p-3 border rounded bg-card">
                        <div className="font-semibold">{n.title || 'Untitled'}</div>
                        <div className="text-sm text-muted-foreground">{(n.content && typeof n.content === 'string') ? (n.content.slice(0, 100)) : ''}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            )}
          </div>
        </div>
      </Navigation>
    </div>
  )
}