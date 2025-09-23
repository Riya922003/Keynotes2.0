export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { getAuthOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema/documents"
import { eq, desc, asc, and, sql } from "drizzle-orm"
import NotesClientPage from "@/components/notes/NotesClientPage"
import DatabaseError from "@/components/DatabaseError"

export default async function NotesPage() {
  const authOptions = await getAuthOptions()
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  let notes: typeof documents.$inferSelect[] = []
  let error: string | null = null

  try {
    // Fetch non-archived notes for the current user, ordered by position first, then by updated_at
    // Treat NULL is_archived as not archived using SQL IS NOT TRUE to match sidebar counts
    notes = await db
      .select()
      .from(documents)
      .where(and(eq(documents.author_id, session.user.id), sql`${documents.is_archived} IS NOT TRUE`))
      .orderBy(asc(documents.position), desc(documents.updated_at))
  } catch (dbError) {
    console.error('Database connection error:', dbError)
    error = dbError instanceof Error ? dbError.message : 'Database connection failed'
  }

  // Filter to only include notes (not journals)
  const userNotes = notes.filter(note => note.type === 'note')

  // If there's a database error, show an error page
  if (error) {
    return <DatabaseError error={error} />
  }

  return <NotesClientPage initialNotes={userNotes} />
}