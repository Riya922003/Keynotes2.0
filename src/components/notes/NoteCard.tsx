'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pin, GripVertical, Palette, Bell, Archive, MoreHorizontal, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import NoteEditor from './NoteEditor'
import { deleteNote, updateNote } from '@/app/actions/noteActions'

interface NoteCardProps {
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
    reminder_date?: Date | null
    reminder_repeat?: string | null
    position?: number | null
  }
  isEditing: boolean
  onToggleEdit: (noteId: string | null) => void
  onNoteDeleted?: (noteId: string) => void
  onNoteUpdated?: (noteId: string, updates: Partial<NoteCardProps['note']>) => void
}

interface BlockContent {
  text?: string
  [key: string]: unknown
}

interface Block {
  content?: string | BlockContent[]
  [key: string]: unknown
}

export default function NoteCard({ 
  note, 
  isEditing, 
  onToggleEdit, 
  onNoteDeleted, 
  onNoteUpdated 
}: NoteCardProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showReminderPicker, setShowReminderPicker] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Predefined colors for notes
  const noteColors = [
    { name: 'Default', value: null, bg: 'bg-background' },
    { name: 'Red', value: '#fef2f2', bg: 'bg-red-50' },
    { name: 'Orange', value: '#fff7ed', bg: 'bg-orange-50' },
    { name: 'Yellow', value: '#fefce8', bg: 'bg-yellow-50' },
    { name: 'Green', value: '#f0fdf4', bg: 'bg-green-50' },
    { name: 'Blue', value: '#eff6ff', bg: 'bg-blue-50' },
    { name: 'Purple', value: '#faf5ff', bg: 'bg-purple-50' },
    { name: 'Pink', value: '#fdf2f8', bg: 'bg-pink-50' },
  ]

  const handleColorChange = async (color: string | null) => {
    try {
      await updateNote(
        note.id,
        note.title || '',
        typeof note.content === 'string' ? note.content : JSON.stringify(note.content),
        color || undefined
      )
      // Call the callback to update parent component's state
      onNoteUpdated?.(note.id, { color })
      setShowColorPicker(false)
    } catch (error) {
      console.error('Failed to change color:', error)
      setShowColorPicker(false)
    }
  }

  const handleReminderSet = async () => {
    // TODO: Implement actual reminder functionality
    console.log('Setting reminder for note:', note.id)
    setShowReminderPicker(false)
  }

  const handleDeleteNote = async () => {
    setIsDeleting(true)
    try {
      await deleteNote(note.id)
      // Call the callback to update parent component's state
      onNoteDeleted?.(note.id)
    } catch (error) {
      console.error('Failed to delete note:', error)
      setIsDeleting(false)
    }
  }

  const handleTogglePin = async () => {
    try {
      const newPinStatus = !note.is_pinned
      await updateNote(
        note.id,
        note.title || '',
        typeof note.content === 'string' ? note.content : JSON.stringify(note.content),
        note.color || undefined,
        newPinStatus
      )
      // Call the callback to update parent component's state
      onNoteUpdated?.(note.id, { is_pinned: newPinStatus })
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowColorPicker(false)
      setShowReminderPicker(false)
    }

    if (showColorPicker || showReminderPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorPicker, showReminderPicker])
  
  // Helper function to extract text content from note content
  const getContentPreview = () => {
    try {
      if (!note.content) return 'No content'
      
      if (typeof note.content === 'string') {
        // If it's a string, try to parse it as JSON first
        try {
          const parsed = JSON.parse(note.content)
          if (Array.isArray(parsed)) {
            // Extract text from BlockNote blocks
            const textContent = parsed
              .map((block: Block) => {
                if (block.content) {
                  if (typeof block.content === 'string') {
                    return block.content
                  }
                  if (Array.isArray(block.content)) {
                    return block.content
                      .map((item: BlockContent) => item.text || '')
                      .join('')
                  }
                }
                return ''
              })
              .join(' ')
              .trim()
            
            return textContent || 'No content'
          }
        } catch {
          // If parsing fails, treat as plain text
          return note.content.slice(0, 100) + (note.content.length > 100 ? '...' : '')
        }
      }
      
      if (typeof note.content === 'object' && Array.isArray(note.content)) {
        // Extract text from BlockNote blocks
        const textContent = note.content
          .map((block: Block) => {
            if (block.content) {
              if (typeof block.content === 'string') {
                return block.content
              }
              if (Array.isArray(block.content)) {
                return block.content
                  .map((item: BlockContent) => item.text || '')
                  .join('')
              }
            }
            return ''
          })
          .join(' ')
          .trim()
        
        return textContent || 'No content'
      }
      
      return 'No content'
    } catch {
      return 'No content'
    }
  }
  
  // Add drag and drop functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: note.id,
    disabled: isEditing || Boolean(note.is_pinned) // Disable dragging when editing or pinned
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // If editing, render a modal overlay
  if (isEditing) {
    return (
      <>
        {/* Modal backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => onToggleEdit(null)}
        />
        
        {/* Modal note editor */}
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <Card 
            className="relative bg-background border rounded-lg shadow-2xl min-w-[320px] max-w-[600px] w-auto max-h-[80vh] overflow-hidden"
            style={{
              backgroundColor: note.color || undefined,
              width: 'fit-content',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="absolute top-3 right-3 z-20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleEdit(null)}
                className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
              >
                ×
              </Button>
            </div>

            {/* Pin indicator */}
            {note.is_pinned && (
              <div className="absolute top-3 right-14">
                <Pin className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            
            {/* Modal content with editor */}
            <div className="p-4 max-h-[calc(80vh-100px)] overflow-y-auto">
              <NoteEditor note={note} />
            </div>

            {/* Note actions/features bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center bg-background/95 backdrop-blur-sm border-t p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Edited {new Date(note.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1 relative">
                {/* Color palette */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
                    title="Change color"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowColorPicker(!showColorPicker)
                      setShowReminderPicker(false)
                    }}
                  >
                    <Palette className="w-4 h-4" />
                  </Button>
                  
                  {/* Color picker dropdown */}
                  {showColorPicker && (
                    <div className="absolute bottom-full mb-2 left-0 bg-background border rounded-lg shadow-lg p-2 z-50">
                      <div className="grid grid-cols-4 gap-1 w-32">
                        {noteColors.map((color) => (
                          <button
                            key={color.name}
                            className={`w-6 h-6 rounded-full border-2 hover:border-gray-400 ${
                              color.value ? '' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color.value || '#ffffff' }}
                            onClick={() => handleColorChange(color.value)}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Reminder */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
                    title="Add reminder"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowReminderPicker(!showReminderPicker)
                      setShowColorPicker(false)
                    }}
                  >
                    <Bell className="w-4 h-4" />
                  </Button>
                  
                  {/* Reminder picker dropdown */}
                  {showReminderPicker && (
                    <div className="absolute bottom-full mb-2 right-0 bg-background border rounded-lg shadow-lg p-2 z-50 min-w-[150px]">
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="justify-start text-sm"
                          onClick={() => handleReminderSet()}
                        >
                          Later today
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="justify-start text-sm"
                          onClick={() => handleReminderSet()}
                        >
                          Tomorrow
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="justify-start text-sm"
                          onClick={() => handleReminderSet()}
                        >
                          Next week
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="justify-start text-sm"
                          onClick={() => handleReminderSet()}
                        >
                          Pick date & time
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Archive */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
                  title="Archive"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('Archiving note:', note.id)
                  }}
                >
                  <Archive className="w-4 h-4" />
                </Button>
                
                {/* Pin/Unpin */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-8 w-8 p-0 hover:bg-muted/50 rounded-full ${note.is_pinned ? 'text-yellow-600' : ''}`}
                  title={note.is_pinned ? "Unpin note" : "Pin note"}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTogglePin()
                  }}
                >
                  <Pin className={`w-4 h-4 ${note.is_pinned ? 'fill-current' : ''}`} />
                </Button>
                
                {/* Delete */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-8 w-8 p-0 hover:bg-red-100 rounded-full transition-colors ${isDeleting ? 'text-red-600 bg-red-100' : 'hover:text-red-600'}`}
                  title="Delete note"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteNote()
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                {/* More options */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
                  title="More"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('More options for note:', note.id)
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Render the original card but dimmed/hidden */}
        <Card 
          ref={setNodeRef}
          className="relative hover:shadow-md transition-shadow cursor-pointer group overflow-visible opacity-50"
          style={{
            ...style,
            backgroundColor: note.color || undefined,
          }}
          {...attributes}
        >
          {/* Pin indicator */}
          {note.is_pinned && (
            <div className="absolute top-2 right-2">
              <Pin className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          
          {/* Main Content */}
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {note.title || 'Untitled'}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground line-clamp-3">
              {getContentPreview()}
            </CardDescription>
          </CardHeader>
        </Card>
      </>
    )
  }

  // Normal collapsed card preview
  return (
    <Card 
      ref={setNodeRef}
      className="relative hover:shadow-md transition-shadow cursor-pointer group overflow-visible"
      style={{
        ...style,
        backgroundColor: note.color || undefined,
      }}
      onClick={() => onToggleEdit(note.id)}
      {...attributes}
    >
      {/* Drag Handle - only show for non-pinned notes */}
      {!note.is_pinned && (
        <div 
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          {...listeners}
          onClick={(e) => e.stopPropagation()} // Prevent triggering note edit
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      {/* Pin indicator */}
      {note.is_pinned && (
        <div className="absolute top-2 right-2">
          <Pin className="w-4 h-4 text-yellow-600 fill-current" />
        </div>
      )}

      {/* Pin toggle button on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {!note.is_pinned && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted/50 rounded-full"
            title="Pin note"
            onClick={(e) => {
              e.stopPropagation()
              handleTogglePin()
            }}
          >
            <Pin className="w-3 h-3 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Delete button on hover - position next to pin icon */}
      <div className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity ${note.is_pinned ? 'right-8' : 'right-8'}`}>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 hover:bg-red-100 rounded-full transition-colors ${isDeleting ? 'text-red-600 bg-red-100' : 'hover:text-red-600'}`}
          title="Delete note"
          onClick={(e) => {
            e.stopPropagation()
            handleDeleteNote()
          }}
          disabled={isDeleting}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      
      {/* Main Content */}
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold line-clamp-2">
          {note.title || 'Untitled'}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3">
          {getContentPreview()}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}