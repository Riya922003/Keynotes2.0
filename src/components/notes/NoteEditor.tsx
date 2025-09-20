'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from 'use-debounce'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { updateNote } from '@/app/actions/noteActions'
import { Input } from '@/components/ui/input'

interface NoteEditorProps {
  note: {
    id: string
    title: string | null
    content: unknown
    type: 'note' | 'journal'
    created_at: Date
    updated_at: Date
    author_id: string
    workspace_id: string
  }
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function NoteEditor({ note }: NoteEditorProps) {
  // Initialize state with note data
  const [title, setTitle] = useState(note.title || '')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Parse initial content for BlockNote
  const getInitialContent = () => {
    if (note.content && typeof note.content === 'object') {
      // If content is already a BlockNote document, use it
      return note.content as Record<string, unknown>[]
    }
    if (typeof note.content === 'string' && note.content.trim()) {
      // If content is a string, create a simple paragraph block
      return [
        {
          type: 'paragraph',
          content: note.content,
        },
      ]
    }
    // Default empty content
    return undefined
  }

  // Initialize BlockNote editor
  const editor = useCreateBlockNote({
    initialContent: getInitialContent(),
  })

  // Debounce the title to avoid excessive API calls
  const [debouncedTitle] = useDebounce(title, 1000)

  // Auto-save function
  const autoSave = useCallback(async (noteTitle: string, editorContent: Record<string, unknown>[]) => {
    // Don't save if both title and content are empty
    const hasTitle = noteTitle.trim()
    const hasContent = editorContent && editorContent.length > 0 && 
                      editorContent.some((block: Record<string, unknown>) => block.content && typeof block.content === 'string' && block.content.trim())

    if (!hasTitle && !hasContent) {
      return
    }

    // Don't save if values haven't actually changed from original
    const originalTitle = note.title || ''
    const originalContent = note.content

    if (noteTitle === originalTitle && JSON.stringify(editorContent) === JSON.stringify(originalContent)) {
      return
    }

    setSaveStatus('saving')

    try {
      // Convert BlockNote content to JSON string for storage
      const contentString = JSON.stringify(editorContent)
      await updateNote(note.id, noteTitle, contentString)
      setSaveStatus('saved')
      
      // Reset to idle after showing "saved" status for a moment
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('Failed to save note:', error)
      setSaveStatus('error')
      
      // Reset to idle after showing error for a moment
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    }
  }, [note.id, note.title, note.content])

  // Effect to trigger auto-save when title changes
  useEffect(() => {
    if (editor) {
      autoSave(debouncedTitle, editor.document)
    }
  }, [debouncedTitle, autoSave, editor])

  // Set up editor content change listener
  useEffect(() => {
    if (editor) {
      const handleContentChange = () => {
        // Debounce the content saving
        setTimeout(() => {
          autoSave(title, editor.document)
        }, 1000)
      }

      editor.onEditorContentChange(handleContentChange)

      // Cleanup listener on unmount
      return () => {
        // BlockNote doesn't provide a direct way to remove listeners
        // The listener will be cleaned up when the editor is destroyed
      }
    }
  }, [editor, title, autoSave])

  // Get save status text and styling
  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return { text: 'Saving...', className: 'text-yellow-600' }
      case 'saved':
        return { text: 'All changes saved', className: 'text-green-600' }
      case 'error':
        return { text: 'Failed to save', className: 'text-red-600' }
      default:
        return { text: '', className: '' }
    }
  }

  const statusDisplay = getSaveStatusDisplay()

  return (
    <div className="flex flex-col w-full min-w-[300px] max-w-[500px]">
      {/* Title input */}
      <div className="mb-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Take a note..."
          className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:text-muted-foreground/60 resize-none"
          style={{ fontSize: '1.125rem', fontWeight: '600' }}
        />
      </div>

      {/* BlockNote editor - compact responsive version */}
      <div className="relative min-h-[150px] max-h-[350px] overflow-y-auto">
        <div className="[&_.bn-editor]:!border-none [&_.bn-editor]:!shadow-none [&_.bn-editor]:!outline-none [&_.bn-editor]:!bg-transparent [&_.bn-editor_.bn-block-outer]:!border-none [&_.bn-editor_.bn-block-content]:!border-none [&_.bn-side-menu]:!hidden [&_.bn-drag-handle]:!hidden">
          <BlockNoteView 
            editor={editor} 
            theme="light"
            className="min-h-[150px] !border-none !outline-none !shadow-none"
            sideMenu={false}
          />
        </div>
        
        {/* Save status indicator */}
        {statusDisplay.text && (
          <div className={`absolute top-2 right-2 text-xs ${statusDisplay.className} bg-background/90 px-2 py-1 rounded shadow-sm z-10`}>
            {statusDisplay.text}
          </div>
        )}
      </div>
    </div>
  )
}