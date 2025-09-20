import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema/documents"
import { eq, desc, asc } from "drizzle-orm"
import NotesClientPage from "@/components/notes/NotesClientPage"

export default async function NotesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  // Fetch all notes for the current user, ordered by position first, then by updated_at
  const notes = await db
    .select()
    .from(documents)
    .where(eq(documents.author_id, session.user.id))
    .orderBy(asc(documents.position), desc(documents.updated_at))

  // Filter to only include notes (not journals)
  const userNotes = notes.filter(note => note.type === 'note')

  return <NotesClientPage initialNotes={userNotes} />
}