"use client"

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
  onSaved?: (updates: { title?: string; content?: unknown }) => void
  autoFocus?: boolean
  onEditorReady?: () => void
}

export default function BlockNoteClient({ note, titleColor, onSaved, autoFocus, onEditorReady }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title || '')

  const getInitialContent = () => {
    if (note.content && typeof note.content === 'object') {
      return note.content as Record<string, unknown>[]
    }
    if (typeof note.content === 'string' && note.content.trim()) {
      return [
        {
          type: 'paragraph',
          content: note.content,
        },
      ]
    }
    return undefined
  }

  const editor = useCreateBlockNote({
    initialContent: getInitialContent(),
    placeholderText: "Type your note",
  })

  // Notify parent when the editor instance is ready
  useEffect(() => {
    if (!editor) return

    const calledRef = { current: false }
    let rafId: number | undefined

    const callReady = () => {
      if (calledRef.current) return
      calledRef.current = true
      try { onEditorReady?.() } catch {}
    }

    // Defer signaling readiness until after the next paint so the editor DOM has a chance to mount
    if (typeof window !== 'undefined') {
      rafId = window.requestAnimationFrame(callReady)
    } else {
      callReady()
    }

    return () => {
      if (rafId !== undefined && typeof window !== 'undefined') window.cancelAnimationFrame(rafId)
    }
  }, [editor, onEditorReady])

  const [debouncedTitle] = useDebounce(title, 1000)

  
  
  const autoSave = useCallback(async (noteTitle: string, editorContent: Record<string, unknown>[]) => {
    const hasTitle = noteTitle.trim()
    const hasContent = editorContent && editorContent.length > 0 && 
      editorContent.some((block: Record<string, unknown>) => block.content && typeof block.content === 'string' && block.content.trim())

    if (!hasTitle && !hasContent) return

    const originalTitle = note.title || ''
    const originalContent = note.content

  // If nothing changed, skip saving. Keep deep-compare via stringify for simplicity.
  if (noteTitle === originalTitle && JSON.stringify(editorContent) === JSON.stringify(originalContent)) return

    try {
  // Send the raw JS object to the server action (no JSON.stringify).
  await updateNote(note.id, noteTitle, editorContent)
  onSaved?.({ title: noteTitle, content: editorContent })
      try { (await import('@/lib/notesSync')).emitNotesUpdated() } catch {}
    } catch {
      // swallow save errors locally; higher-level sync will attempt again
    }
  }, [note.id, note.title, note.content, onSaved])

  useEffect(() => {
    if (editor) {
      autoSave(debouncedTitle, editor.document)
    }
  }, [debouncedTitle, autoSave, editor])

  useEffect(() => {
    if (editor) {
      const handleContentChange = () => {
        setTimeout(() => {
          autoSave(title, editor.document)
        }, 1000)
      }

      editor.onEditorContentChange(handleContentChange)
      return () => {}
    }
  }, [editor, title, autoSave])

  return (
    <div className="flex flex-col w-full min-w-[300px] max-w-[500px]">
      <div className="mb-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Take a note..."
          className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:text-muted-foreground/60 resize-none"
          style={{ fontSize: '1.125rem', fontWeight: '600', color: titleColor || undefined }}
          autoFocus={autoFocus}
        />
      </div>

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
