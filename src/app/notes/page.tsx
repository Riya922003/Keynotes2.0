export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions as topAuthOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema/documents"
import { eq, desc, asc, and, sql } from "drizzle-orm"
import NotesClientPage from "@/components/notes/NotesClientPage"
import DatabaseError from "@/components/DatabaseError"

export default async function NotesPage() {
  const session = await getServerSession(topAuthOptions)

  if (!session) {
    redirect('/')
  }

  let notes: any[] = []
  let shared: any[] = []
  let error: string | null = null

  try {
    // Fetch owned + shared notes via a server-side helper
  const { ownedNotes, sharedNotes } = await (await import('@/app/actions/noteActions')).getUserAndSharedNotes()
  notes = ownedNotes || []
  shared = sharedNotes || []
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

  return <NotesClientPage initialNotes={userNotes} sharedNotes={sharedNotes} />
}