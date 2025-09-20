'use client'

import { deleteNote } from '@/app/actions/noteActions'
import { Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTransition, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

interface NoteCardProps {
  note: {
    id: string
    title: string | null
    content: unknown
    color?: string | null
  }
  onEdit: () => void
}

export default function NoteCard({ note, onEdit }: NoteCardProps) {
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Color options matching CreateNoteForm
  const colorOptions = [
    { 
      name: 'Default', 
      value: null, 
      light: 'bg-background', 
      dark: 'bg-background',
      textClass: 'text-foreground'
    },
    { 
      name: 'Red', 
      value: '#fee2e2', 
      light: '#fee2e2', 
      dark: '#7f1d1d',
      textClass: 'text-red-900 dark:text-red-100'
    },
    { 
      name: 'Orange', 
      value: '#fed7aa', 
      light: '#fed7aa', 
      dark: '#9a3412',
      textClass: 'text-orange-900 dark:text-orange-100'
    },
    { 
      name: 'Yellow', 
      value: '#fef3c7', 
      light: '#fef3c7', 
      dark: '#a16207',
      textClass: 'text-yellow-900 dark:text-yellow-100'
    },
    { 
      name: 'Green', 
      value: '#dcfce7', 
      light: '#dcfce7', 
      dark: '#14532d',
      textClass: 'text-green-900 dark:text-green-100'
    },
    { 
      name: 'Blue', 
      value: '#dbeafe', 
      light: '#dbeafe', 
      dark: '#1e3a8a',
      textClass: 'text-blue-900 dark:text-blue-100'
    },
    { 
      name: 'Purple', 
      value: '#e9d5ff', 
      light: '#e9d5ff', 
      dark: '#581c87',
      textClass: 'text-purple-900 dark:text-purple-100'
    },
    { 
      name: 'Pink', 
      value: '#fce7f3', 
      light: '#fce7f3', 
      dark: '#831843',
      textClass: 'text-pink-900 dark:text-pink-100'
    },
  ]

  // Get the current color option for styling
  const getCurrentColorOption = () => {
    return colorOptions.find(color => color.value === note.color) || colorOptions[0]
  }

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
    <Card 
      className={`relative hover:shadow-md transition-shadow cursor-pointer group ${getCurrentColorOption().textClass}`}
      style={{
        backgroundColor: note.color && mounted ? (
          theme === 'dark' 
            ? getCurrentColorOption().dark 
            : getCurrentColorOption().light
        ) : undefined
      }}
      onClick={onEdit}
    >
      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity z-10"
        onClick={(e) => {
          e.stopPropagation() // Prevent triggering onEdit when delete is clicked
          handleDelete(e)
        }}
        disabled={isPending}
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      {/* Main Content */}
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold truncate pr-8">
          {note.title || 'Untitled Note'}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3">
          {getContentSnippet(note.content)}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}