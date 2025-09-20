'use client'

import { Pin, Archive, Palette } from 'lucide-react'
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
  } | null
  onClose: () => void
}

export default function NoteEditorModal({ note, onClose }: NoteEditorModalProps) {
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
    
    try {
      // Import the server action dynamically to avoid issues
      const { toggleArchiveNote } = await import('@/app/actions/noteActions')
      await toggleArchiveNote(note.id)
    } catch (error) {
      console.error('Failed to toggle archive:', error)
    }
  }

  const handleColorChange = () => {
    // Placeholder for color functionality
    console.log('Color change not implemented yet')
  }

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
              note?.is_pinned ? 'bg-muted hover:bg-muted/80' : 'hover:bg-muted'
            }`}
            onClick={handleTogglePin}
            title={note?.is_pinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin className={`w-4 h-4 ${note?.is_pinned ? 'text-foreground' : 'text-muted-foreground'}`} />
          </Button>

          {/* Archive Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 rounded-full ${
              note?.is_archived ? 'bg-muted hover:bg-muted/80' : 'hover:bg-muted'
            }`}
            onClick={handleToggleArchive}
            title={note?.is_archived ? 'Unarchive note' : 'Archive note'}
          >
            <Archive className={`w-4 h-4 ${note?.is_archived ? 'text-foreground' : 'text-muted-foreground'}`} />
          </Button>

          {/* Color Button (Placeholder) */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-muted"
            onClick={handleColorChange}
            title="Change color"
          >
            <Palette className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}