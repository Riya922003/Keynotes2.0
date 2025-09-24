 'use server'

import { eq, and, sql, desc, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { document_collaborators } from '@/lib/db/schema/collaborators'
import { workspaces } from '@/lib/db/schema/workspaces'
import { revalidatePath } from 'next/cache'
import { broadcastNotesUpdated } from '@/lib/realtime'
import { redis } from '@/lib/redis'

const NOTE_UPDATE_CHANNEL = 'note-updates'
import { getServerSession } from 'next-auth'
import { authOptions as topAuthOptions } from '@/lib/auth'
import { NoteSummary } from '@/types/note'

// Reduce note objects sent over the wire to the minimal fields clients need
function minimizeNote(note: unknown): NoteSummary | null {
  if (!note || typeof note !== 'object') return null
  const n = note as Record<string, unknown>
  return {
    id: String(n.id ?? ''),
    title: (n.title as string) ?? null,
    content: (n.content as unknown) ?? null,
    type: (n.type as 'note' | 'journal') ?? 'note',
    created_at: (n.created_at as string | Date) ?? null,
    updated_at: (n.updated_at as string | Date) ?? null,
    author_id: (n.author_id as string) ?? null,
    workspace_id: (n.workspace_id as string) ?? null,
    color: (n.color as string) ?? null,
    is_pinned: Boolean(n.is_pinned),
    is_archived: Boolean(n.is_archived),
    is_starred: Boolean(n.is_starred),
    is_favorited: Boolean(n.is_favorited),
    position: (n.position as number) ?? null,
    reminder_date: (n.reminder_date as string | Date) ?? null,
    reminder_repeat: (n.reminder_repeat as string) ?? null,
  }
}

// Generate a unique ID for documents
function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Get or create default workspace for user
async function getDefaultWorkspace(userId: string): Promise<string> {
  // Try to find user's first workspace
  const userWorkspaces = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.owner_id, userId))
    .limit(1)

  if (userWorkspaces.length > 0) {
    return userWorkspaces[0].id
  }

  // Create default workspace if none exists
  const workspaceId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  await db.insert(workspaces).values({
    id: workspaceId,
    name: 'My Workspace',
    owner_id: userId,
  })

  return workspaceId
}

// Some server actions interact with Drizzle ORM and return DB row shapes that are verbose to type here.
// Disable the explicit-any rule for these exports to keep code readable; we can tighten types later.
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function createNote(title?: string, content?: string, color?: string): Promise<any> {
  const session = await getServerSession(topAuthOptions)
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    // Get or create default workspace
    const workspaceId = await getDefaultWorkspace(session.user.id)
    
    // Generate unique document ID
    const documentId = generateId()
    
    // Insert new note
    const newNote = await db.insert(documents).values({
      id: documentId,
      type: 'note',
      title: title || 'Untitled Note',
      content: content || null,
      color: color || null,
      author_id: session.user.id,
      workspace_id: workspaceId,
    }).returning()

    // Revalidate the notes page
    revalidatePath('/notes')
    try {
      // Notify owner (creator) and any collaborators (none on new note yet, but keep pattern)
      const recipients: string[] = [session.user.id]
      // Broadcast locally and publish a richer payload for cross-instance subscribers
      const min = minimizeNote(newNote[0])
      broadcastNotesUpdated({ type: 'noteCreated', note: min }, recipients)
      try {
        if (redis) {
          await redis.publish(NOTE_UPDATE_CHANNEL, JSON.stringify({ type: 'noteCreated', note: min, recipients }))
        }
      } catch {}
    } catch {}
    return newNote[0]
  } catch (error: unknown) {
    console.error('Error creating note:', error)
    throw new Error('Failed to create note')
  }
}

export async function updateNote(
  noteId: string, 
  title: string, 
  content: string, 
  color?: string | null, 
  isPinned?: boolean, 
  isArchived?: boolean,
  reminderDate?: string,
  reminderRepeat?: string
) {
  const session = await getServerSession(topAuthOptions)
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    // If content arrived as a JSON string (e.g. double-stringified), parse it so
    // we always store a proper JS object into the JSONB column.
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content)
      } catch (parseErr) {
        // If parsing fails, leave the raw string so we don't crash the update.
        // Emit a warning to help diagnose malformed payloads.
        console.warn('updateNote: failed to JSON.parse(content) - saving raw string', parseErr)
      }
    }

    // Prepare the update object
    const updateData: {
      title: string
      content: unknown
      updated_at: Date
      color?: string | null
      is_pinned?: boolean | null
      is_archived?: boolean | null
      reminder_date?: Date | null
      reminder_repeat?: string | null
    } = {
      title,
      content: content ?? null,
      updated_at: new Date(),
    }

    // Only include color if it's provided (accept null to clear)
    if (color !== undefined) {
      updateData.color = color
    }

    // Only include pin state if it's provided
    if (isPinned !== undefined) {
      updateData.is_pinned = isPinned
    }

    // Only include archive state if it's provided
    if (isArchived !== undefined) {
      updateData.is_archived = isArchived
    }

    // Only include reminder data if it's provided
    if (reminderDate !== undefined) {
      updateData.reminder_date = reminderDate ? new Date(reminderDate) : null
    }

    if (reminderRepeat !== undefined) {
      updateData.reminder_repeat = reminderRepeat
    }

    // Update the note
    const updatedNote = await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, noteId))
      .returning()

    if (updatedNote.length === 0) {
      throw new Error('Note not found')
    }

    // Revalidate both the notes list and the specific note page
    revalidatePath('/notes')
    revalidatePath(`/notes/${noteId}`)
    try {
      // Fetch collaborator user ids so we can notify all affected users
      const collabRows = await db.select({ userId: document_collaborators.userId }).from(document_collaborators).where(eq(document_collaborators.documentId, noteId))
      const recipients = Array.from(new Set([session.user.id, ...collabRows.map(r => r.userId)]))
      const min = minimizeNote(updatedNote[0])
      broadcastNotesUpdated({ type: 'noteUpdated', note: min }, recipients)
      try {
        if (redis) {
          await redis.publish(NOTE_UPDATE_CHANNEL, JSON.stringify({ type: 'noteUpdated', note: min, recipients }))
        }
      } catch {}
    } catch {}
    
    return updatedNote[0]
  } catch (error: unknown) {
    console.error('Error updating note:', error)
    throw new Error('Failed to update note')
  }
}

export async function deleteNote(noteId: string): Promise<any> {
  try {
  const session = await getServerSession(topAuthOptions)
    
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    // Ensure noteId is properly formatted and not empty
    if (!noteId || typeof noteId !== 'string' || noteId.trim() === '') {
      throw new Error('Invalid note ID')
    }

    const trimmedNoteId = noteId.trim()

    // First verify the note exists and belongs to the user
    const noteToDelete = await db
      .select({ id: documents.id, author_id: documents.author_id })
      .from(documents)
      .where(eq(documents.id, trimmedNoteId))
      .limit(1)

    if (noteToDelete.length === 0) {
      throw new Error('Note not found')
    }

    if (noteToDelete[0].author_id !== session.user.id) {
      throw new Error('You can only delete your own notes')
    }
    
    // Delete the note
    const deletedNote = await db
      .delete(documents)
      .where(eq(documents.id, trimmedNoteId))
      .returning({ id: documents.id })

    if (deletedNote.length === 0) {
      throw new Error('Note could not be deleted')
    }

    // Revalidate the notes page
    revalidatePath('/notes')
    try {
      // Notify owner and collaborators about deletion
      const collabRows = await db.select({ userId: document_collaborators.userId }).from(document_collaborators).where(eq(document_collaborators.documentId, trimmedNoteId))
      const recipients = Array.from(new Set([session.user.id, ...collabRows.map(r => r.userId)]))
      const deletedId = deletedNote[0].id
      broadcastNotesUpdated({ type: 'noteDeleted', noteId: deletedId }, recipients)
      try {
        if (redis) {
          await redis.publish(NOTE_UPDATE_CHANNEL, JSON.stringify({ type: 'noteDeleted', noteId: deletedId, recipients }))
        }
      } catch {}
    } catch {}
    return { success: true, deletedNoteId: deletedNote[0].id }
    
  } catch (error: unknown) {
    throw error
  }
}

export async function togglePinNote(noteId: string): Promise<any> {
  const session = await getServerSession(topAuthOptions)
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    // First, get the current note to check its pinned status
    const currentNote = await db
      .select()
      .from(documents)
      .where(eq(documents.id, noteId))
      .limit(1)

    if (currentNote.length === 0) {
      throw new Error('Note not found')
    }

    // Verify the note belongs to the current user
    if (currentNote[0].author_id !== session.user.id) {
      throw new Error('Unauthorized access to note')
    }

    // Toggle the pinned status
    const updatedNote = await db
      .update(documents)
      .set({
        is_pinned: !currentNote[0].is_pinned,
        updated_at: new Date(),
      })
      .where(eq(documents.id, noteId))
      .returning()

    // Revalidate the notes page
      try {
        // notify cross-instance that a pin toggle occurred; publish the full updated note so clients can update state without refetch
        if (redis) await redis.publish(NOTE_UPDATE_CHANNEL, JSON.stringify({ type: 'noteToggledPin', payload: updatedNote[0], recipients: [session.user.id] }))
      } catch {}
    revalidatePath('/notes')
    
    return updatedNote[0]
  } catch (error: unknown) {
    console.error('Error toggling pin status:', error)
    throw new Error('Failed to toggle pin status')
  }
}

export async function toggleArchiveNote(noteId: string): Promise<any> {
  const session = await getServerSession(topAuthOptions)
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    // First, get the current note to check its archived status
    const currentNote = await db
      .select()
      .from(documents)
      .where(eq(documents.id, noteId))
      .limit(1)

    if (currentNote.length === 0) {
      throw new Error('Note not found')
    }

    // Verify the note belongs to the current user
    if (currentNote[0].author_id !== session.user.id) {
      throw new Error('Unauthorized access to note')
    }

    // Toggle the archived status
    const updatedNote = await db
      .update(documents)
      .set({
        is_archived: !currentNote[0].is_archived,
        updated_at: new Date(),
      })
      .where(eq(documents.id, noteId))
      .returning()

    // Revalidate the notes page
    try {
      // Publish the full updated note for consumers to apply locally
      if (redis) await redis.publish(NOTE_UPDATE_CHANNEL, JSON.stringify({ type: 'noteToggledArchive', payload: updatedNote[0], recipients: [session.user.id] }))
    } catch {}
    revalidatePath('/notes')
    
    return updatedNote[0]
  } catch (error: unknown) {
    console.error('Error toggling archive status:', error)
    throw new Error('Failed to toggle archive status')
  }
}

// Additional helper function to get notes for a user
export async function getUserNotes() {
  const session = await getServerSession(topAuthOptions)
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    const notes = await db
      .select()
      .from(documents)
      .where(eq(documents.author_id, session.user.id))
      .orderBy(documents.updated_at)

    return notes
  } catch (error: unknown) {
    console.error('Error fetching notes:', error)
    throw new Error('Failed to fetch notes')
  }
}

// Helper function to get a specific note
export async function getNote(noteId: string) {
  const session = await getServerSession(topAuthOptions)
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    const note = await db
      .select()
      .from(documents)
      .where(eq(documents.id, noteId))
      .limit(1)

    if (note.length === 0) {
      throw new Error('Note not found')
    }

    // Verify the note belongs to the current user
    if (note[0].author_id !== session.user.id) {
      throw new Error('Unauthorized access to note')
    }

    return note[0]
  } catch (error: unknown) {
    console.error('Error fetching note:', error)
    throw new Error('Failed to fetch note')
  }
}

export async function updateNoteReminder(
  noteId: string, 
  reminderDate?: string,
  reminderTime?: string,
  reminderRepeat?: string
) {
  const session = await getServerSession(topAuthOptions)
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    // Combine date and time into a single datetime
    let combinedDateTime: Date | null = null
    if (reminderDate && reminderTime) {
      combinedDateTime = new Date(`${reminderDate}T${reminderTime}:00`)
    }

    // Update the note with reminder data
    const updatedNote = await db
      .update(documents)
      .set({
        reminder_date: combinedDateTime,
        reminder_repeat: reminderRepeat || null,
        updated_at: new Date(),
      })
      .where(eq(documents.id, noteId))
      .returning()

    if (updatedNote.length === 0) {
      throw new Error('Note not found')
    }

    // Revalidate the notes page
      try {
        const min = minimizeNote(updatedNote[0])
        if (redis) await redis.publish(NOTE_UPDATE_CHANNEL, JSON.stringify({ type: 'noteReminderUpdated', note: min, recipients: [session.user.id] }))
      } catch {}
    revalidatePath('/notes')
    
    return updatedNote[0]
  } catch (error: unknown) {
    console.error('Error updating note reminder:', error)
    throw new Error('Failed to update note reminder')
  }
}

export async function removeNoteReminder(noteId: string) {
  const session = await getServerSession(topAuthOptions)
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    // Remove reminder by setting both fields to null
    const updatedNote = await db
      .update(documents)
      .set({
        reminder_date: null,
        reminder_repeat: null,
        updated_at: new Date(),
      })
      .where(eq(documents.id, noteId))
      .returning()

    if (updatedNote.length === 0) {
      throw new Error('Note not found')
    }

    // Revalidate the notes page
    try {
      const min = minimizeNote(updatedNote[0])
      if (redis) await redis.publish(NOTE_UPDATE_CHANNEL, JSON.stringify({ type: 'noteReminderRemoved', note: min, recipients: [session.user.id] }))
    } catch {}
    revalidatePath('/notes')
    
    return updatedNote[0]
  } catch (error: unknown) {
    console.error('Error removing note reminder:', error)
    throw new Error('Failed to remove note reminder')
  }
}

export async function updateNoteOrder(notes: { id: string; position: number }[]) {
  const session = await getServerSession(topAuthOptions)
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    let successCount = 0
    let errorCount = 0

    // Simple approach: update positions sequentially
    for (const note of notes) {
      try {
        await db
          .update(documents)
          .set({ position: note.position, updated_at: new Date() })
          .where(eq(documents.id, note.id))
          
        successCount++
      } catch {
        errorCount++
        // Continue with other notes instead of throwing
      }
    }

    // Revalidate the notes page
      try {
      const noteIds = notes.map((n: { id: string; position: number }) => n.id)
      // For ordering updates, broadcast a batch event with recipients = author only (we could expand to collaborators if necessary)
      if (redis) await redis.publish(NOTE_UPDATE_CHANNEL, JSON.stringify({ type: 'notesReordered', noteIds, recipients: [session.user.id] }))
    } catch {}
    revalidatePath('/notes')
    
    // Only throw if all updates failed
    if (errorCount > 0 && successCount === 0) {
      throw new Error(`All ${errorCount} note position updates failed`)
    }
    
    return { success: true, updated: successCount, failed: errorCount }
  } catch (error: unknown) {
    // Instead of throwing, return a more graceful response
    if (error instanceof Error && error.message.includes('Authentication required')) {
      throw error
    }
    
    // For other errors, log but don't crash the drag operation
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Toggle the starred status of a note
export async function toggleStarNote(noteId: string) {
  const session = await getServerSession(topAuthOptions)
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    // Get the current note to check its starred status
    const currentNote = await db
      .select()
      .from(documents)
      .where(eq(documents.id, noteId))
      .limit(1)

    if (currentNote.length === 0) {
      throw new Error('Note not found')
    }

    // Verify ownership
    if (currentNote[0].author_id !== session.user.id) {
      throw new Error('Unauthorized access to note')
    }

    // Toggle the starred status
    const updatedNote = await db
      .update(documents)
      .set({
        is_starred: !currentNote[0].is_starred,
        updated_at: new Date(),
      })
      .where(eq(documents.id, noteId))
      .returning()

    // Revalidate the notes page
    revalidatePath('/notes')

    return updatedNote[0]
  } catch (error) {
    console.error('Error toggling star status:', error)
    throw new Error('Failed to toggle star status')
  }
}

// Get counts for sidebar: non-archived notes, archived notes, and starred notes
export async function getSidebarCounts() {
  const session = await getServerSession(topAuthOptions)

  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    // Efficient COUNT queries
    // Use SQL IS TRUE / IS NOT TRUE to correctly handle NULL values created before
    // the column had a default. Treat NULL as not archived (IS NOT TRUE).
    const notesCountRes = await db
      .select({ count: sql`count(*)` })
      .from(documents)
      .where(and(
        eq(documents.author_id, session.user.id),
        sql`${documents.is_archived} IS NOT TRUE`,
        eq(documents.type, 'note')
      ))

    const archivedCountRes = await db
      .select({ count: sql`count(*)` })
      .from(documents)
      .where(and(
        eq(documents.author_id, session.user.id),
        sql`${documents.is_archived} IS TRUE`,
        eq(documents.type, 'note')
      ))

    const starredCountRes = await db
      .select({ count: sql`count(*)` })
      .from(documents)
      .where(and(
        eq(documents.author_id, session.user.id),
        sql`${documents.is_starred} IS TRUE`,
        sql`${documents.is_archived} IS NOT TRUE`,
        eq(documents.type, 'note')
      ))

    // Drizzle returns counts as string for some drivers, parse to number safely
  const notesCount = Number(((notesCountRes[0] as unknown) as { count: string })?.count ?? 0)
  const archivedCount = Number(((archivedCountRes[0] as unknown) as { count: string })?.count ?? 0)
  const starredCount = Number(((starredCountRes[0] as unknown) as { count: string })?.count ?? 0)

    // Count shared (documents where user is collaborator and document isn't archived)
    const sharedCountRes = await db
      .select({ count: sql`count(*)` })
      .from(document_collaborators)
      .leftJoin(documents, eq(document_collaborators.documentId, documents.id))
      .where(and(eq(document_collaborators.userId, session.user.id), sql`${documents.is_archived} IS NOT TRUE`, eq(documents.type, 'note')))

    const sharedCount = Number(((sharedCountRes[0] as unknown) as { count: string })?.count ?? 0)

    return {
      notesCount,
      archivedCount,
      starredCount,
      sharedCount,
    }
  } catch (error) {
    console.error('Error getting sidebar counts:', error)
    throw new Error('Failed to get sidebar counts')
  }
}

// (removed alias getNotesCounts) API route now calls getSidebarCounts directly

// Get the 3 most recently updated notes for the current user
export async function getRecentNotes() {
  const session = await getServerSession(topAuthOptions)

  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    const recentNotes = await db
      .select()
      .from(documents)
      .where(and(eq(documents.author_id, session.user.id), eq(documents.type, 'note')))
      .orderBy(desc(documents.updated_at))
      .limit(3)

    return recentNotes
  } catch (error) {
    console.error('Error fetching recent notes:', error)
    throw new Error('Failed to fetch recent notes')
  }
}

// Get both owned and shared notes for the current user (non-archived)
export async function getUserAndSharedNotes() {
  const session = await getServerSession(topAuthOptions)

  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    // Owned notes
    const ownedNotes = await db
      .select()
      .from(documents)
      .where(and(eq(documents.author_id, session.user.id), sql`${documents.is_archived} IS NOT TRUE`, eq(documents.type, 'note')))
      .orderBy(asc(documents.position), desc(documents.updated_at))

    // Shared notes via document_collaborators — select document fields explicitly
    const sharedNotes = await db
      .select({
        id: documents.id,
        title: documents.title,
        content: documents.content,
        type: documents.type,
        mood_score: documents.mood_score,
        created_at: documents.created_at,
        updated_at: documents.updated_at,
        author_id: documents.author_id,
        workspace_id: documents.workspace_id,
        color: documents.color,
        is_pinned: documents.is_pinned,
        is_archived: documents.is_archived,
        is_starred: documents.is_starred,
        is_favorited: documents.is_favorited,
        reminder_date: documents.reminder_date,
        reminder_repeat: documents.reminder_repeat,
        position: documents.position,
      })
      .from(document_collaborators)
      .leftJoin(documents, eq(document_collaborators.documentId, documents.id))
      .where(and(eq(document_collaborators.userId, session.user.id), sql`${documents.is_archived} IS NOT TRUE`, eq(documents.type, 'note')))
      .orderBy(desc(documents.updated_at))

    return { ownedNotes, sharedNotes }
  } catch (error) {
    console.error('Error fetching user/shared notes:', error)
    throw new Error('Failed to fetch notes')
  }
}