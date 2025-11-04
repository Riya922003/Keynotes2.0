'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NoteSummary } from '@/types/note'
import CreateJournalForm from '@/components/journal/CreateJournalForm'
import CalendarPicker from '@/components/journal/CalendarPicker'
import JournalEntryModal from '@/components/journal/JournalEntryModal'
import NoteCard from '@/components/notes/NoteCard'
import { Button } from '@/components/ui/button'
import Navigation from '@/components/navigation/Navigation'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'
import { useToast } from '@/hooks/use-toast'

interface JournalClientPageProps {
  initialEntries: NoteSummary[]
  currentMonth?: string
}

export default function JournalClientPage({ initialEntries, currentMonth }: JournalClientPageProps) {
  const router = useRouter()
  const [entries, setEntries] = useState<NoteSummary[]>(initialEntries)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [formOpenKey, setFormOpenKey] = useState<number>(0)
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>(undefined)
  const [formOpen, setFormOpen] = useState<boolean>(false)
  const { toast } = useToast()
  const [openEntry, setOpenEntry] = useState<NoteSummary | null>(null)

  const handleEntryCreated = (newEntry: NoteSummary) => {
    setEntries([newEntry, ...entries])
    
    // If a month filter is active, clear it to show the new entry
    if (currentMonth) {
      router.push('/journal')
    }
  }

  const handleDateSelect = async (date: string) => {
    try {
      const res = await fetch(`/api/journal/by-date?date=${encodeURIComponent(date)}`)
      if (!res.ok) {
        // If server error, show an error toast
        toast({ title: 'Error', description: 'Unable to check entries for that date. Please try again.' })
        return
      }
      const json = await res.json()
      if (json && json.found && json.entry && json.entry.id) {
        // Open the existing entry in the journal modal
        setOpenEntry(json.entry as NoteSummary)
      } else {
        // No existing entry — show informational toast and do not open editor
        toast({ title: 'No entry', description: 'You have no entry for this date.' })
      }
    } catch (err) {
      console.error('date select error', err)
      toast({ title: 'Error', description: 'Something went wrong while checking that date.' })
    }
  }

  const handleEntryDeleted = (deletedNoteId: string) => {
    setEntries(entries.filter(entry => entry.id !== deletedNoteId))
  }

  const handleEntryUpdated = (noteId: string, updates: Partial<NoteSummary>) => {
    setEntries(entries.map(entry => 
      entry.id === noteId ? { ...entry, ...updates } : entry
    ))
  }

  return (
    <div className="fixed inset-0 bg-background">
      {/* Top Right Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggleButton />
      </div>

      <Navigation>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">
              {currentMonth ? `Entries for ${currentMonth}` : 'My Journal'}
            </h1>
            {currentMonth && (
              <Button 
                variant="outline" 
                onClick={() => router.push('/journal')}
              >
                Clear Filter
              </Button>
            )}
          </div>
          
          {/* Create Journal Form + Calendar (side-by-side) */}
          <div className="flex justify-center">
            <div className="w-full max-w-[50%] flex items-start gap-2">
              <div className="flex-1">
                <CreateJournalForm key={formOpenKey} initialOpen={formOpen} initialDate={formInitialDate} onEntryCreatedAction={(entry) => { setFormOpen(false); setFormInitialDate(undefined); setFormOpenKey(Date.now()); handleEntryCreated(entry) }} />
              </div>
              <CalendarPicker onSelectAction={handleDateSelect} />
            </div>
          </div>
          
          {/* Journal Entries Grid */}
          <div>
            {entries.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p>You have no journal entries yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {entries.map((entry) => (
                  <NoteCard
                    key={entry.id}
                    note={entry}
                    isEditing={editingNoteId === entry.id}
                    // Open the journal-specific modal instead of toggling the global note editor
                    onToggleEditAction={(noteId) => {
                      if (!noteId) {
                        // close
                        setOpenEntry(null)
                        setEditingNoteId(null)
                        return
                      }
                      const found = entries.find((e) => e.id === noteId)
                      if (found) {
                        setOpenEntry(found)
                      } else {
                        // fallback to original behavior
                        setEditingNoteId(noteId)
                      }
                    }}
                    onNoteDeleted={handleEntryDeleted}
                    onNoteUpdated={handleEntryUpdated}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Journal entry modal (opened via calendar/date selection) */}
          {openEntry && (
            <JournalEntryModal entry={openEntry} open={Boolean(openEntry)} onOpenChange={(o) => { if (!o) setOpenEntry(null) }} />
          )}
        </div>
      </Navigation>
    </div>
  )
}
