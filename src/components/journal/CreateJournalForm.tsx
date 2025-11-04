'use client'

import { useState } from 'react'
import { createJournalEntry } from '@/app/actions/noteActions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import type { NoteSummary } from '@/types/note'

interface CreateJournalFormProps {
  onEntryCreatedAction: (newEntry: NoteSummary) => void
  initialOpen?: boolean
  initialDate?: string // YYYY-MM-DD
}

export default function CreateJournalForm({ onEntryCreatedAction, initialOpen = false, initialDate }: CreateJournalFormProps) {
  const [isExpanded, setIsExpanded] = useState(initialOpen)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    // If both title and content are empty, just close the form
    if (!title.trim() && !content.trim()) {
      resetForm()
      return
    }

    setIsLoading(true)
    try {
      // Call the server action to create the journal entry
      const newEntry = await createJournalEntry(
        title.trim() || 'Untitled Journal Entry',
        content.trim(),
        initialDate
      )

      if (newEntry) {
        // Notify parent component of the new entry
        onEntryCreatedAction(newEntry)
        // Reset the form
        resetForm()
      }
    } catch (error) {
      console.error('Failed to create journal entry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setIsExpanded(false)
  }

  if (!isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        className="w-full p-4 border rounded-lg bg-card hover:bg-accent/50 cursor-pointer transition-colors"
      >
        <p className="text-muted-foreground">Write a new journal entry...</p>
      </div>
    )
  }

  return (
    <>
      {/* Full-page overlay backdrop */}
      <div 
        className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50"
        onClick={resetForm}
      />
      
      {/* Full-page form container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-4xl h-[90vh] bg-card border rounded-lg shadow-xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h3 className="text-2xl font-semibold">New Journal Entry</h3>
              {initialDate && (
                <div className="text-sm text-muted-foreground">Date: {initialDate}</div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetForm}
              className="h-8 w-8 p-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form Content */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden"
          >
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="text-xl font-medium border-none shadow-none focus-visible:ring-0 px-0"
            />

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind today?"
              className="flex-1 resize-none border-none shadow-none focus-visible:ring-0 px-0 text-base"
              autoFocus
            />

            {/* Footer with buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isLoading}
              >
                Close
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Entry'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
