'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from 'use-debounce'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import '@/styles/blocknote-custom.css'
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
  titleColor?: string
  onSaved?: (updates: { title?: string; content?: string }) => void
}

export default function NoteEditor({ note, titleColor, onSaved }: NoteEditorProps) {
  // Initialize state with note data
  const [title, setTitle] = useState(note.title || '')

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
    placeholderText: "Type your note",
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

    try {
      // Convert BlockNote content to JSON string for storage
      const contentString = JSON.stringify(editorContent)
    await updateNote(note.id, noteTitle, contentString)
    // Notify parent that note was saved so UI can update in real-time
    onSaved?.({ title: noteTitle, content: contentString })
    try { (await import('@/lib/notesSync')).emitNotesUpdated() } catch {}
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }, [note.id, note.title, note.content, onSaved])

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

  return (
    <div className="flex flex-col w-full min-w-[300px] max-w-[500px]">
      {/* Title input */}
      <div className="mb-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Take a note..."
          className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:text-muted-foreground/60 resize-none"
          style={{ fontSize: '1.125rem', fontWeight: '600', color: titleColor || undefined }}
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
      </div>
    </div>
  )
}