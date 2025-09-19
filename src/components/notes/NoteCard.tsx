'use client'

import Link from 'next/link'
import { deleteNote } from '@/app/actions/noteActions'
import { X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTransition } from 'react'

interface NoteCardProps {
  note: {
    id: string
    title: string | null
    content: unknown
  }
}

export default function NoteCard({ note }: NoteCardProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent the Link navigation
    e.stopPropagation()
    
    startTransition(async () => {
      try {
        await deleteNote(note.id)
      } catch (error) {
        console.error('Failed to delete note:', error)
      }
    })
  }

  // Extract text content from note content for snippet
  const getContentSnippet = (content: unknown): string => {
    if (!content) return 'No content'
    
    try {
      // If content is a string, use it directly
      if (typeof content === 'string') {
        return content.slice(0, 100) + (content.length > 100 ? '...' : '')
      }
      
      // If content is an object (like JSON), try to extract text
      if (typeof content === 'object') {
        const text = JSON.stringify(content).replace(/[{}"\[\]]/g, ' ')
        return text.slice(0, 100) + (text.length > 100 ? '...' : '')
      }
      
      return 'No content'
    } catch {
      return 'No content'
    }
  }

  return (
    <Card className="relative hover:shadow-md transition-shadow">
      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity z-10"
        onClick={handleDelete}
        disabled={isPending}
      >
        <X className="h-3 w-3" />
      </Button>

      {/* Main Content Link */}
      <Link href={`/notes/${note.id}`} className="block group">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold truncate pr-8">
            {note.title || 'Untitled Note'}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground line-clamp-3">
            {getContentSnippet(note.content)}
          </CardDescription>
        </CardHeader>
      </Link>
    </Card>
  )
}