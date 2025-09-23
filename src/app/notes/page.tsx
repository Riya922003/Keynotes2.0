export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions as topAuthOptions } from "@/lib/auth"
import NotesClientPage from "@/components/notes/NotesClientPage"
import DatabaseError from "@/components/DatabaseError"
import NoteUpdatesListener from '@/components/notes/NoteUpdatesListener'

export default async function NotesPage() {
  const session = await getServerSession(topAuthOptions)

  if (!session) {
    redirect('/')
  }

  let notes: import('@/types/note').NoteSummary[] = []
  let shared: import('@/types/note').NoteSummary[] = []
  let error: string | null = null

  try {
    // Fetch owned + shared notes via a server-side helper
  const { ownedNotes, sharedNotes } = await (await import('@/app/actions/noteActions')).getUserAndSharedNotes()
  notes = (ownedNotes || []) as import('@/types/note').NoteSummary[]
  shared = (sharedNotes || []) as import('@/types/note').NoteSummary[]
  } catch (dbError) {
    console.error('Database connection error:', dbError)
    error = dbError instanceof Error ? dbError.message : 'Database connection failed'
  }

  // Filter to only include notes (not journals)
  const userNotes = notes.filter(note => note.type === 'note')
  const sharedNotes = shared.filter(note => note && note.type === 'note')

  // If there's a database error, show an error page
  if (error) {
    return <DatabaseError error={error} />
  }

  return (
    <>
      <NoteUpdatesListener />
      <NotesClientPage initialNotes={userNotes} sharedNotes={sharedNotes} />
    </>
  )
}