import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema/documents"
import { eq, desc } from "drizzle-orm"
import Navigation from "@/components/navigation/Navigation"
import NoteCard from "@/components/notes/NoteCard"
import CreateNoteForm from "@/components/notes/CreateNoteForm"
import { ThemeToggleButton } from "@/components/ThemeToggleButton"

export default async function NotesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  // Fetch all notes for the current user
  const notes = await db
    .select()
    .from(documents)
    .where(eq(documents.author_id, session.user.id))
    .orderBy(desc(documents.updated_at))

  // Filter to only include notes (not journals)
  const userNotes = notes.filter(note => note.type === 'note')

  return (
    <div className="fixed inset-0 bg-background">
      {/* Top Right Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggleButton />
      </div>
      
      <Navigation>
        <div className="space-y-6">
          {/* Static Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Notes</h1>
          </div>

          {/* Create Note Form */}
          <CreateNoteForm />

          {/* Notes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userNotes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">
                  You have no notes yet. Create one!
                </p>
              </div>
            ) : (
              userNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))
            )}
          </div>
        </div>
      </Navigation>
    </div>
  )
}