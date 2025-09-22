 'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, Archive, Palette, Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import NoteEditor from './NoteEditor'

interface NoteEditorModalProps {
  note: {
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
    is_starred?: boolean | null
  } | null
  onClose: () => void
}

export default function NoteEditorModal({ note, onClose }: NoteEditorModalProps) {
  const router = useRouter()

  // Local optimistic copy of note for UI updates
  const [localNote, setLocalNote] = useState<NoteEditorModalProps['note'] | null>(note)

  useEffect(() => {
    setLocalNote(note)
  }, [note])

  const handleTogglePin = async () => {
    if (!note) return
    
    try {
      // Import the server action dynamically to avoid issues
      const { togglePinNote } = await import('@/app/actions/noteActions')
      await togglePinNote(note.id)
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  const handleToggleArchive = async () => {
    if (!note) return

  // optimistic update
  const prev = localNote
  setLocalNote((n: NoteEditorModalProps['note'] | null) => n ? { ...n, is_archived: !n.is_archived } : n)

    try {
      const { toggleArchiveNote } = await import('@/app/actions/noteActions')
      await toggleArchiveNote(note.id)

      // Signal other components (sidebar) to refresh counts
      try { (await import('@/lib/notesSync')).emitNotesUpdated() } catch {}

      // If the note was archived, navigate to archived list and close modal
  const nowArchived = !prev?.is_archived
      if (nowArchived) {
        onClose()
        router.push('/notes/archived')
      }
    } catch (error) {
      console.error('Failed to toggle archive:', error)
      // revert optimistic
      setLocalNote(prev)
    }
  }

  const handleToggleStar = async () => {
    if (!note) return

  // optimistic update
  const prev = localNote
  setLocalNote((n: NoteEditorModalProps['note'] | null) => n ? { ...n, is_starred: !n.is_starred } : n)

    try {
      const { toggleStarNote } = await import('@/app/actions/noteActions')
      await toggleStarNote(note.id)

      // Signal other components (sidebar) to refresh counts
      try { (await import('@/lib/notesSync')).emitNotesUpdated() } catch {}

      // If the note was starred, optionally navigate to starred list and close modal
      const nowStarred = !prev?.is_starred
      if (nowStarred) {
        onClose()
        router.push('/notes/starred')
      }
    } catch (error) {
      console.error('Failed to toggle star:', error)
      // revert optimistic
      setLocalNote(prev)
    }
  }

  const handleColorChange = () => {
    // Future: implement color change functionality
  }

  // Determine icon color for modal toolbar (white for colored cards, muted otherwise)
  const modalIconClass = (() => {
    if (!localNote?.color) return 'text-muted-foreground'
    try {
      const hex = (localNote.color as string).replace('#','')
      const r = parseInt(hex.substring(0,2),16)/255
      const g = parseInt(hex.substring(2,4),16)/255
      const b = parseInt(hex.substring(4,6),16)/255
      const srgb = [r,g,b].map((v)=> v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4))
      const lum = 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2]
      return lum < 0.5 ? 'text-white' : 'text-muted-foreground'
    } catch {
      return 'text-muted-foreground'
    }
  })()

  return (
    <Dialog open={note !== null} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          {/* Header content can be added here if needed */}
        </DialogHeader>
        
        {/* Note Editor */}
        <div className="flex-1 overflow-hidden">
          {note && <NoteEditor note={note} />}
        </div>
        
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-4 border-t">
          {/* Pin Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 rounded-full ${
              localNote?.is_pinned ? 'bg-muted hover:bg-muted/80' : 'hover:bg-muted'
            }`}
            onClick={handleTogglePin}
            title={localNote?.is_pinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin className={`w-4 h-4 ${localNote?.is_pinned ? 'text-foreground' : modalIconClass}`} />
          </Button>

          {/* Archive Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 rounded-full ${
              localNote?.is_archived ? 'bg-muted hover:bg-muted/80' : 'hover:bg-muted'
            }`}
            onClick={handleToggleArchive}
            title={localNote?.is_archived ? 'Unarchive note' : 'Archive note'}
          >
            <Archive className={`w-4 h-4 ${localNote?.is_archived ? 'text-foreground' : modalIconClass}`} />
          </Button>

          {/* Color Button (Placeholder) */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-muted"
            onClick={handleColorChange}
            title="Change color"
          >
            <Palette className={`w-4 h-4 ${modalIconClass}`} />
          </Button>
          {/* Star Button */}
            <Button
            variant="ghost"
            size="sm"
              className={`h-8 w-8 p-0 rounded-full ${
              localNote?.is_starred ? 'bg-muted hover:bg-muted/80' : 'hover:bg-muted'
            }`}
            onClick={handleToggleStar}
            title={localNote?.is_starred ? 'Unstar note' : 'Star note'}
          >
            <Star className={`w-4 h-4 ${localNote?.is_starred ? 'text-foreground' : modalIconClass}`} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}