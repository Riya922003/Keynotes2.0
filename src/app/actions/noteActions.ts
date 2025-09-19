'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { workspaces } from '@/lib/db/schema/workspaces'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

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

export async function createNote(title?: string, content?: string, color?: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
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
    
    return newNote[0]
  } catch (error) {
    console.error('Error creating note:', error)
    throw new Error('Failed to create note')
  }
}

export async function updateNote(noteId: string, title: string, content: string, color?: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  try {
    // Prepare the update object
    const updateData: {
      title: string
      content: unknown
      updated_at: Date
      color?: string | null
    } = {
      title,
      content: content ? JSON.parse(content) : null,
      updated_at: new Date(),
    }

    // Only include color if it's provided
    if (color !== undefined) {
      updateData.color = color
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
    
    return updatedNote[0]
  } catch (error) {
    console.error('Error updating note:', error)
    throw new Error('Failed to update note')
  }
}

export async function deleteNote(noteId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  try {
    // Delete the note
    const deletedNote = await db
      .delete(documents)
      .where(eq(documents.id, noteId))
      .returning()

    if (deletedNote.length === 0) {
      throw new Error('Note not found')
    }

    // Revalidate the notes page
    revalidatePath('/notes')
    
    return { success: true, deletedNote: deletedNote[0] }
  } catch (error) {
    console.error('Error deleting note:', error)
    throw new Error('Failed to delete note')
  }
}

export async function togglePinNote(noteId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
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
    revalidatePath('/notes')
    
    return updatedNote[0]
  } catch (error) {
    console.error('Error toggling pin status:', error)
    throw new Error('Failed to toggle pin status')
  }
}

export async function toggleArchiveNote(noteId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
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
    revalidatePath('/notes')
    
    return updatedNote[0]
  } catch (error) {
    console.error('Error toggling archive status:', error)
    throw new Error('Failed to toggle archive status')
  }
}

// Additional helper function to get notes for a user
export async function getUserNotes() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  try {
    const notes = await db
      .select()
      .from(documents)
      .where(eq(documents.author_id, session.user.id))
      .orderBy(documents.updated_at)

    return notes
  } catch (error) {
    console.error('Error fetching notes:', error)
    throw new Error('Failed to fetch notes')
  }
}

// Helper function to get a specific note
export async function getNote(noteId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
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
  } catch (error) {
    console.error('Error fetching note:', error)
    throw new Error('Failed to fetch note')
  }
}