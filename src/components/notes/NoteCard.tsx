'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pin, GripVertical, Palette, Bell, Archive, MoreHorizontal, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import NoteEditor from './NoteEditor'
import ReminderPicker from './ReminderPicker'
import { deleteNote, updateNote, toggleArchiveNote, removeNoteReminder } from '@/app/actions/noteActions'

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
  const [isRemovingReminder, setIsRemovingReminder] = useState(false)
  
  // Predefined colors for notes - using darker, more vibrant colors for better text visibility
  const noteColors = [
    { name: 'Default', value: null, bg: 'bg-background', border: 'border-gray-300' },
    { name: 'Red', value: '#fee2e2', bg: 'bg-red-100', border: 'border-red-300' },
    { name: 'Orange', value: '#fed7aa', bg: 'bg-orange-100', border: 'border-orange-300' },
    { name: 'Yellow', value: '#fef3c7', bg: 'bg-yellow-100', border: 'border-yellow-300' },
    { name: 'Green', value: '#dcfce7', bg: 'bg-green-100', border: 'border-green-300' },
    { name: 'Blue', value: '#dbeafe', bg: 'bg-blue-100', border: 'border-blue-300' },
    { name: 'Purple', value: '#e9d5ff', bg: 'bg-purple-100', border: 'border-purple-300' },
    { name: 'Pink', value: '#fce7f3', bg: 'bg-pink-100', border: 'border-pink-300' },
  ];

  // Map note color to a readable dark color for the title
  const titleColorMap = {
    '#fee2e2': '#b91c1c', // Red
    '#fed7aa': '#c2410c', // Orange
    '#fef3c7': '#a16207', // Yellow
    '#dcfce7': '#166534', // Green
    '#dbeafe': '#1e40af', // Blue
    '#e9d5ff': '#7c3aed', // Purple
    '#fce7f3': '#be185d', // Pink
  };

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

  const handleReminderSet = async (reminder: { date: Date | null, repeat: string | null }) => {
    // Close the reminder picker
    setShowReminderPicker(false)
    
    // Update the parent component's state immediately
    onNoteUpdated?.(note.id, { 
      reminder_date: reminder.date, 
      reminder_repeat: reminder.repeat 
    })
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

  const handleToggleArchive = async () => {
    try {
      await toggleArchiveNote(note.id)
      // Update the parent component's state
      onNoteUpdated?.(note.id, { is_archived: !note.is_archived })
    } catch (error) {
      console.error('Failed to toggle archive:', error)
    }
  }

  const handleRemoveReminder = async () => {
    if (isRemovingReminder) return // Prevent double clicks
    
    setIsRemovingReminder(true)
    try {
      await removeNoteReminder(note.id)
      // Update the parent component's state immediately
      onNoteUpdated?.(note.id, { reminder_date: null, reminder_repeat: null })
    } catch (error) {
      console.error('Failed to remove reminder:', error)
    } finally {
      setIsRemovingReminder(false)
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Don't close if clicking inside the reminder picker or color picker
      if (target.closest('.reminder-picker-dropdown') || 
          target.closest('.color-picker-dropdown') ||
          target.closest('[data-reminder-modal="true"]')) {
        return
      }
      
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

  // Compute readable title color based on note color
  const computedTitleColor = note.color && typeof note.color === 'string' && titleColorMap.hasOwnProperty(note.color)
    ? titleColorMap[note.color as keyof typeof titleColorMap]
    : '#374151' // default: gray-700

  // If editing, render a modal overlay using portal
  if (isEditing && typeof document !== 'undefined') {
    return createPortal(
      <>
        {/* Modal backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-[9998]"
          onClick={() => onToggleEdit(null)}
        />
        
        {/* Modal note editor */}
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
          <div
            className="w-full h-full flex items-center justify-center"
            data-note-editor-modal="true"
            onClick={(e) => {
              // Only close if clicking this container, not its children
              if (e.target === e.currentTarget) {
                onToggleEdit(null)
              }
            }}
          >
          <Card 
            className="relative bg-background border rounded-lg shadow-2xl min-w-[320px] max-w-[600px] w-auto max-h-[80vh] overflow-hidden"
            style={{
              backgroundColor: note.color || undefined,
              width: 'fit-content',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div 
              className="absolute top-3 right-3 z-[50]"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleEdit(null)
                }}
                className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
                style={{ color: computedTitleColor }}
              >
                ×
              </Button>
            </div>
            
            {/* Modal content with editor */}
            <div 
              className="p-4 max-h-[calc(80vh-100px)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <NoteEditor
                note={note}
                titleColor={computedTitleColor}
                onSaved={(updates) => {
                  // Update parent immediately so UI reflects changes in real-time
                  if (updates.title !== undefined) {
                    onNoteUpdated?.(note.id, { title: updates.title })
                  }
                  if (updates.content !== undefined) {
                    onNoteUpdated?.(note.id, { content: updates.content })
                  }
                }}
              />
            </div>

            {/* Note actions/features bar at bottom */}
            <div 
              className="absolute bottom-0 left-0 right-0 flex justify-between items-center bg-background/95 backdrop-blur-sm border-t p-3"
              onClick={(e) => e.stopPropagation()}
            >
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
                    <div 
                      className="absolute bottom-full mb-2 left-0 bg-background border rounded-lg shadow-lg p-2 z-[60] color-picker-dropdown"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="grid grid-cols-4 gap-1 w-32">
                        {noteColors.map((color) => (
                          <button
                            key={color.name}
                            className={`w-6 h-6 rounded-full border-2 hover:border-gray-600 transition-colors relative ${
                              color.value ? 'border-gray-400' : 'border-gray-400'
                            } ${
                              note.color === color.value ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                            }`}
                            style={{ backgroundColor: color.value || '#ffffff' }}
                            onClick={() => handleColorChange(color.value)}
                            title={color.name}
                          >
                            {/* Add a subtle shadow or checkmark for selected color */}
                            {note.color === color.value && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                              </div>
                            )}
                          </button>
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
                    className={`h-8 w-8 p-0 hover:bg-muted/50 rounded-full ${note.reminder_date ? 'text-blue-600' : ''}`}
                    title={note.reminder_date ? "Remove reminder (right-click to edit)" : "Add reminder"}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (note.reminder_date) {
                        // If reminder is set, remove it on left click
                        handleRemoveReminder()
                      } else {
                        // If no reminder, open picker
                        setShowReminderPicker(!showReminderPicker)
                        setShowColorPicker(false)
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      // Right-click opens picker for editing even if reminder is set
                      setShowReminderPicker(!showReminderPicker)
                      setShowColorPicker(false)
                    }}
                    disabled={isRemovingReminder}
                  >
                    <Bell className={`w-4 h-4 ${note.reminder_date ? (isRemovingReminder ? 'text-muted-foreground' : 'fill-current') : ''}`} />
                  </Button>
                  
                  {/* Reminder picker dropdown */}
                  {showReminderPicker && (
                    <ReminderPicker
                      noteId={note.id}
                      currentReminder={{
                        date: note.reminder_date,
                        repeat: note.reminder_repeat
                      }}
                      onReminderSet={handleReminderSet}
                      onClose={() => setShowReminderPicker(false)}
                    />
                  )}
                </div>
                
                {/* Archive */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-8 w-8 p-0 hover:bg-muted/50 rounded-full ${note.is_archived ? 'text-orange-600' : ''}`}
                  title={note.is_archived ? "Unarchive" : "Archive"}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleArchive()
                  }}
                >
                  <Archive className={`w-4 h-4 ${note.is_archived ? 'fill-current' : ''}`} />
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
                    // Future: implement more options menu
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
          </div>
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
            <CardTitle 
              className="text-lg font-semibold line-clamp-2"
              style={{ color: computedTitleColor }}
            >
              {note.title || 'Untitled'}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground line-clamp-3">
              {getContentPreview()}
            </CardDescription>
          </CardHeader>
        </Card>
      </>,
      document.body
    )
  }

  // Normal collapsed card preview
  return (
    <Card 
      ref={setNodeRef}
      className="relative hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer group overflow-visible transform hover:scale-[1.02]"
      style={{
        ...style,
        backgroundColor: note.color || undefined,
        // Add a subtle glow for pinned notes
        boxShadow: note.is_pinned ? '0 0 0 2px rgba(255, 193, 7, 0.3)' : undefined,
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

      {/* Pin indicator and toggle button */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {/* Reminder indicator - show when reminder is set */}
        {note.reminder_date && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted/50 rounded-full"
            title="Remove reminder"
            onClick={(e) => {
              e.stopPropagation()
              handleRemoveReminder()
            }}
            disabled={isRemovingReminder}
          >
            <Bell className={`w-3 h-3 ${isRemovingReminder ? 'text-muted-foreground' : 'text-blue-600 fill-current'}`} />
          </Button>
        )}
        
        {note.is_pinned ? (
          /* Pinned state - clicking unpins */
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted/50 rounded-full"
            title="Unpin note"
            onClick={(e) => {
              e.stopPropagation()
              handleTogglePin()
            }}
          >
            <Pin className="w-3 h-3 text-yellow-600 fill-current" />
          </Button>
        ) : (
          /* Unpinned state - show pin button on hover */
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
          </div>
        )}
      </div>

      {/* Delete button on hover - position dynamically based on other icons */}
      <div className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity ${
        // Calculate position based on how many icons are present
        (() => {
          let iconCount = 1; // Always have pin icon
          if (note.reminder_date) iconCount++; // Add reminder icon if present
          return iconCount === 1 ? 'right-8' : iconCount === 2 ? 'right-14' : 'right-20';
        })()
      }`}>
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
        <CardTitle className="text-lg font-semibold line-clamp-2" style={{ color: computedTitleColor }}>
          {note.title || 'Untitled'}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3">
          {getContentPreview()}
        </CardDescription>
        {/* Reminder info */}
        {note.reminder_date && (
          <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
            <Bell className="w-3 h-3" />
            <span>
              Reminder: {new Date(note.reminder_date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              })} at{' '}
              {new Date(note.reminder_date).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
              })}
              {note.reminder_repeat && note.reminder_repeat !== "Doesn't repeat" && (
                <span className="ml-1">({note.reminder_repeat})</span>
              )}
            </span>
          </div>
        )}
      </CardHeader>
    </Card>
  )
}