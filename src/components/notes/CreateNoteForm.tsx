'use client'

import { useState, useRef, useEffect } from 'react'
import { useOnClickOutside } from '@/lib/hooks/useOnClickOutside'
import { createNote } from '@/app/actions/noteActions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import LocalSplashCursor from '@/components/LocalSplashCursor'
import { useTheme } from 'next-themes'
import { 
  Palette, 
  Pin, 
  Archive, 
  MoreHorizontal, 
  Bell,
  Sparkles
} from 'lucide-react'

import type { NoteSummary } from '@/types/note'

interface CreateNoteFormProps {
  onNoteCreated?: (newNote: NoteSummary) => void
}

export default function CreateNoteForm({ onNoteCreated }: CreateNoteFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [isPinned, setIsPinned] = useState(false)
  const [showSplashCursor, setShowSplashCursor] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Color options that work well in both light and dark modes
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
    return colorOptions.find(color => color.value === selectedColor) || colorOptions[0]
  }

  const handleSubmit = async () => {
    // Only submit if there's content to save
    if (title.trim() || content.trim()) {
      try {
        const newNote = await createNote(title.trim() || 'Untitled', content.trim(), selectedColor || undefined)
        
        // Call the parent callback to update the UI immediately
        if (onNoteCreated && newNote) {
          onNoteCreated(newNote)
      try { (await import('@/lib/notesSync')).emitNotesUpdated() } catch {}
        }
      } catch (error) {
        console.error('Failed to create note:', error)
      }
    }
    
    // Reset form state
    setTitle('')
    setContent('')
    setSelectedColor(null)
    setIsPinned(false)
    setIsExpanded(false)
  }

  // Use the custom hook to handle clicks outside the form
  useOnClickOutside(formRef, handleSubmit)

  const handlePlaceholderClick = () => {
    setIsExpanded(true)
  }

  const handleClose = () => {
    handleSubmit()
  }

  if (!isExpanded) {
    return (
      <div
        onClick={handlePlaceholderClick}
        className="w-full max-w-2xl mx-auto p-4 rounded-lg bg-background hover:bg-accent/50 cursor-text transition-colors duration-200 shadow-sm"
      >
        <div className="text-muted-foreground">
          Take a note...
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={formRef} className="w-full max-w-2xl mx-auto">
        <Card 
          className={`shadow-lg transition-colors duration-200 ${getCurrentColorOption().textClass}`}
          style={{ 
            backgroundColor: selectedColor && mounted ? (
              theme === 'dark' 
                ? getCurrentColorOption().dark 
                : getCurrentColorOption().light
            ) : undefined 
          }}
        >
          <CardContent className="p-4 space-y-3 relative">
          {/* Title Input */}
          <div className="flex items-center gap-2 relative z-20">
            <Input
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="Title"
              className="border-none shadow-none focus-visible:ring-0 text-lg font-semibold px-0 bg-transparent"
              autoFocus
            />
            {isPinned && (
              <Pin className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          
          {/* Content Editor */}
          <div className="min-h-[100px] relative z-20">
            <Textarea
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              placeholder="Take a note..."
              className="border-none shadow-none focus-visible:ring-0 resize-none px-0 bg-transparent min-h-[100px] text-base"
              rows={4}
            />
          </div>

            {/* SplashCursor overlay when active - positioned behind content */}
            {showSplashCursor && (
              <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none" style={{ zIndex: 5 }}>
                <LocalSplashCursor 
                  SIM_RESOLUTION={32}
                  DYE_RESOLUTION={256}
                  DENSITY_DISSIPATION={2.0}
                  VELOCITY_DISSIPATION={1.0}
                  PRESSURE={0.03}
                  CURL={15}
                  SPLAT_RADIUS={0.1}
                  SPLAT_FORCE={2000}
                  SHADING={false}
                  TRANSPARENT={true}
                  BACK_COLOR={{ r: 0, g: 0, b: 0 }}
                />
              </div>
            )}
          
          {/* Google Keep inspired toolbar */}
          <div className="flex items-center justify-between pt-2 relative z-20">
            <div className="flex items-center gap-1">
              {/* Color Palette */}
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted rounded-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Palette className="w-4 h-4 text-muted-foreground" />
                </Button>
                
                {/* Horizontal color picker dropdown */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-popover border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.name}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedColor(color.value)
                        }}
                        className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform flex-shrink-0 ${
                          selectedColor === color.value ? 'border-ring ring-2 ring-ring/30' : 'border-border'
                        }`}
                        style={{ backgroundColor: color.value || undefined }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-center">Choose a color</div>
                </div>
              </div>

              {/* Pin Button */}
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 rounded-full ${
                  isPinned ? 'bg-muted hover:bg-muted/80' : 'hover:bg-muted'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsPinned(!isPinned)
                }}
              >
                <Pin className={`w-4 h-4 ${isPinned ? 'text-foreground' : 'text-muted-foreground'}`} />
              </Button>

              {/* Sparkle Button */}
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 rounded-full ${
                  showSplashCursor ? 'bg-purple-200 hover:bg-purple-300 dark:bg-purple-800 dark:hover:bg-purple-700' : 'hover:bg-muted'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSplashCursor(!showSplashCursor)
                }}
                title="Toggle fluid animation"
              >
                <Sparkles className={`w-4 h-4 ${showSplashCursor ? 'text-purple-700 dark:text-purple-300' : 'text-muted-foreground'}`} />
              </Button>

              {/* Reminder Bell */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Bell className="w-4 h-4 text-muted-foreground" />
              </Button>

              {/* Archive */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Archive className="w-4 h-4 text-muted-foreground" />
              </Button>

              {/* More options */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>

            {/* Close Button */}
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="text-sm text-foreground hover:bg-muted/80 hover:text-foreground"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  )
}