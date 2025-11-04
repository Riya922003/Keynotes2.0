"use client"

import React from 'react'
import { createPortal } from 'react-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { NoteSummary } from '@/types/note'

interface Props {
  entry: NoteSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}

function normalizeContent(c: unknown): string {
  if (!c) return ''
  // If string, try to parse JSON BlockNote output
  if (typeof c === 'string') {
    try {
      const parsed = JSON.parse(c)
      if (Array.isArray(parsed)) {
        return parsed
          .map((block: unknown) => {
            if (!block) return ''
            if (typeof block === 'string') return block
            if (typeof block === 'object' && block !== null) {
              const content = (block as { content?: unknown }).content
              if (typeof content === 'string') return content
              if (Array.isArray(content)) {
                return content
                  .map((item: unknown) => {
                    if (!item) return ''
                    if (typeof item === 'string') return item
                    if (typeof item === 'object' && item !== null) {
                      return (item as { text?: unknown }).text ?? ''
                    }
                    return ''
                  })
                  .join('')
              }
            }
            return ''
          })
          .join('\n\n')
      }
      return String(parsed)
    } catch {
      return String(c)
    }
  }

  if (Array.isArray(c)) {
    return c
      .map((b: unknown) => {
        if (!b) return ''
        if (typeof b === 'string') return b
        if (typeof b === 'object' && b !== null) {
          const content = (b as { content?: unknown }).content
          if (typeof content === 'string') return content
          if (Array.isArray(content)) {
            return content
              .map((item: unknown) => {
                if (!item) return ''
                if (typeof item === 'string') return item
                if (typeof item === 'object' && item !== null) return (item as { text?: unknown }).text ?? ''
                return ''
              })
              .join('')
          }
        }
        return ''
      })
      .join('\n\n')
  }

  return String(c)
}

export default function JournalEntryModal({ entry, open, onOpenChange }: Props) {
  if (!open || typeof document === 'undefined') return null

  const content = normalizeContent(entry.content)

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={() => onOpenChange(false)} />

      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-6">
        <div className="w-full max-w-4xl h-[80vh]">
          <Card className="w-full h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">{entry.title || 'Journal Entry'}</h2>
              <div>
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>×</Button>
              </div>
            </div>

            <div className="p-6 h-full overflow-y-auto text-sm text-muted-foreground">
              <div className="prose prose-invert whitespace-pre-wrap">{content || 'No content'}</div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </Card>
        </div>
      </div>
    </>,
    document.body
  )
}
