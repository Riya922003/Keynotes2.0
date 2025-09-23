import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { getAuthOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema/documents"
import { eq } from "drizzle-orm"
import NoteEditor from "@/components/notes/NoteEditor"

interface NotePageProps {
  params: Promise<{
    noteId: string
  }>
}

export default async function NotePage({ params }: NotePageProps) {
  const { noteId } = await params
  const authOptions = await getAuthOptions()
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  try {
    // Fetch the specific note from the database
    const noteResult = await db
      .select()
      .from(documents)
      .where(eq(documents.id, noteId))
      .limit(1)

    // If note not found, redirect to notes page
    if (noteResult.length === 0) {
      redirect('/notes')
    }

    const note = noteResult[0]

    // Check if the note belongs to the current user
    if (note.author_id !== session.user.id) {
      redirect('/notes')
    }

    // Render the note editor with the note data
    return <NoteEditor note={note} />
  } catch (error) {
    console.error('Error fetching note:', error)
    redirect('/notes')
  }
}