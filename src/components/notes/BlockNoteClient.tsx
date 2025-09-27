"use client"

import { useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import '@/styles/blocknote-custom.css'
import { updateNote } from '@/app/actions/noteActions'
import type { EditorDocument } from '@/types/editor'
// BlockNote types are complex; for our purposes narrow to the document shape
type PartialBlock = {
  type: string
  content?: unknown
}
import { Input } from '@/components/ui/input'
import type { ComponentProps } from 'react'

interface NoteEditorProps {
  note: {
    id: string
    title: string | null
    content: EditorDocument | string | null
    type: 'note' | 'journal'
    created_at: Date
    updated_at: Date
    author_id: string
    workspace_id: string
  }
  titleColor?: string
  onSaved?: (updates: { title?: string; content?: EditorDocument | string | null }) => void
  autoFocus?: boolean
  onEditorReady?: () => void
  readOnly?: boolean
}

export default function BlockNoteClient({ note, titleColor, onSaved, autoFocus, onEditorReady, readOnly }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title || '')

  const getInitialContent = (): PartialBlock[] | undefined => {
    if (note.content && typeof note.content === 'object') {
      return note.content as PartialBlock[]
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

  // Local content state for debouncing
  const [content, setContent] = useState<EditorDocument | string | null>(() => {
    const init = getInitialContent()
    if (init) return init as unknown as EditorDocument
    if (note.content) return note.content
    return null
  })

  // The BlockNote types are complex; cast via unknown then to the hook's param type to avoid explicit `any`.
  const options = {
    initialContent: getInitialContent() ?? undefined,
    placeholderText: 'Type your note',
  } as unknown

  const editor = useCreateBlockNote(options as Parameters<typeof useCreateBlockNote>[0])

  // Notify parent when the editor instance is ready
  useEffect(() => {
    if (!editor) return

    let rafId: number | undefined
    const callReady = () => {
      try {
        onEditorReady?.()
      } catch {}
    }

    if (typeof window !== 'undefined') {
      rafId = window.requestAnimationFrame(callReady)
    } else {
      callReady()
    }

    return () => {
      if (rafId !== undefined && typeof window !== 'undefined') window.cancelAnimationFrame(rafId)
    }
  }, [editor, onEditorReady])

  // Debounced save: only run updateNote after user has paused typing for 1500ms
  const debouncedSave = useDebouncedCallback(
    async (noteTitle: string, editorContent: EditorDocument | string | null) => {
      console.log('Attempting to save note update...')
      const hasTitle = noteTitle.trim()
      const hasContent =
        editorContent &&
        (Array.isArray(editorContent)
          ? editorContent.length > 0 &&
            editorContent.some((block: PartialBlock) => block.content && typeof block.content === 'string' && String(block.content).trim())
          : Boolean(String(editorContent).trim()))

      if (!hasTitle && !hasContent) return

      const originalTitle = note.title || ''
      const originalContent = note.content

      // If nothing changed, skip saving. Keep deep-compare via stringify for simplicity.
      if (noteTitle === originalTitle && JSON.stringify(editorContent) === JSON.stringify(originalContent)) return

      // If this view is read-only (viewer), skip saving
      if (readOnly) return

      try {
        await updateNote(note.id, noteTitle, editorContent)
        onSaved?.({ title: noteTitle, content: editorContent })
        try {
          ;(await import('@/lib/notesSync')).emitNotesUpdated()
        } catch {}
      } catch {
        // swallow save errors locally; higher-level sync will attempt again
      }
    },
    1500,
  )

  // when editor becomes available, seed local content
  useEffect(() => {
    if (!editor) return
    try {
      setContent(editor.document as EditorDocument)
    } catch {}
  }, [editor])

  // update local content on editor changes
  useEffect(() => {
    if (!editor) return

    const handleContentChange = () => {
      try {
        setContent(editor.document as EditorDocument)
      } catch {}
    }

    editor.onEditorContentChange(handleContentChange)
    return () => {
      // no-op: editor doesn't expose unsubscribe here in the version we're using
    }
  }, [editor])

  // run debounced save when title or content changes
  useEffect(() => {
    if (!editor) return
    debouncedSave(title, content)
  }, [title, content, debouncedSave, editor])

  return (
    <div className="flex flex-col w-full min-w-[300px] max-w-[500px]">
      <div className="mb-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={readOnly}
          placeholder="Take a note..."
          className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:text-muted-foreground/60 resize-none"
          style={{ fontSize: '1.125rem', fontWeight: '600', color: titleColor || undefined }}
          autoFocus={autoFocus}
        />
      </div>

      <div className="relative min-h-[150px] max-h-[350px] overflow-y-auto">
        <div className="[&_.bn-editor]:!border-none [&_.bn-editor]:!shadow-none [&_.bn-editor]:!outline-none [&_.bn-editor]:!bg-transparent [&_.bn-editor_.bn-block-outer]:!border-none [&_.bn-editor_.bn-block-content]:!border-none [&_.bn-side-menu]:!hidden [&_.bn-drag-handle]:!hidden">
          <div className="relative">
            <BlockNoteView
            // editor's complex generic type can conflict with the library's view type; cast through unknown
            editor={editor as unknown as ComponentProps<typeof BlockNoteView>['editor']}
            theme="light"
            className="min-h-[150px] !border-none !outline-none !shadow-none"
            sideMenu={false}
          />
            {readOnly && (
              // Overlay to block input while preserving visual appearance
              <div className="absolute inset-0 bg-transparent z-20" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
