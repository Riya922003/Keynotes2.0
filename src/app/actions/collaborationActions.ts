"use server"

import { db } from '@/lib/db';
import { users, document_collaborators, workspace_members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { broadcastNotesUpdated } from '@/lib/realtime'
import { getServerSession } from 'next-auth'
import { authOptions as topAuthOptions } from '@/lib/auth'
import { documents } from '@/lib/db/schema/documents'

// Server-only action to invite a user to collaborate on a note/document
export async function inviteUserToNote(documentId: string, inviteeEmail: string, role: 'editor' | 'viewer') {
  // Require authentication and that caller is the document owner
  const session = await getServerSession(topAuthOptions)
  if (!session?.user?.id) {
    return { error: 'Authentication required.' }
  }

  // Validate role at runtime to prevent invalid values from being inserted
  if (role !== 'editor' && role !== 'viewer') {
    return { error: 'Invalid role. Must be "editor" or "viewer".' }
  }

  // verify document exists and caller is owner
  const docRows = await db.select({ id: documents.id, author_id: documents.author_id }).from(documents).where(eq(documents.id, documentId)).limit(1)
  if (docRows.length === 0) return { error: 'Document not found.' }
  if (docRows[0].author_id !== session.user.id) return { error: 'Only the owner can invite collaborators.' }

  // Find the user by email
  const foundUsers = await db.select().from(users).where(eq(users.email, inviteeEmail)).limit(1);
  const user = foundUsers[0];

  if (!user) {
    return { error: 'User not found.' };
  }

  // Prevent inviting yourself
  if (user.id === session.user.id) {
    return { error: 'You cannot invite yourself as a collaborator.' }
  }

  // Check if they are already a collaborator for this document
  const existing = await db
    .select()
    .from(document_collaborators)
    .where(and(eq(document_collaborators.userId, user.id), eq(document_collaborators.documentId, documentId)));

  if (existing.length > 0) {
    return { error: 'User is already a collaborator.' };
  }

  // Insert collaborator with provided role
  await db.insert(document_collaborators).values({ documentId, userId: user.id, role });

  // Revalidate the note page so incremental static regeneration updates
  try {
    revalidatePath(`/notes/${documentId}`);
    // Broadcast an enriched event: collaboratorAdded with document and user info
    try {
      broadcastNotesUpdated(
        { type: 'collaboratorAdded', documentId, collaborator: { id: user.id, email: user.email, name: user.name } },
        // Notify the owner and the newly added collaborator
        [session.user.id, user.id]
      )
    } catch {}
  } catch {
    // Swallow revalidation errors but continue
  }

  return { success: 'User invited successfully.' };
}

export async function getCollaborators(documentId: string) {
  // Select collaborator entries joined with user info
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar_url: users.image,
      role: document_collaborators.role,
    })
    .from(document_collaborators)
    .leftJoin(users, eq(document_collaborators.userId, users.id))
    .where(eq(document_collaborators.documentId, documentId));

  return rows;
}

export async function getUserById(userId: string) {
  try {
    const rows = await db.select({ id: users.id, name: users.name, email: users.email, image: users.image }).from(users).where(eq(users.id, userId)).limit(1)
    return rows[0] || null
  } catch {
      // swallow DB lookup errors and return null so UI falls back to id
    return null
  }
}

// Search users by prefix (case-insensitive) on email or name. Returns up to 10 results.
export async function searchUsersByPrefix(prefix: string, documentId?: string) {
  if (!prefix || prefix.trim().length === 0) return []
  const q = prefix.trim().toLowerCase()
  try {
    const { sql } = await import('drizzle-orm')
    const pattern = q + '%'

    // If a documentId is provided, try to limit suggestions to users in the same workspace
    let workspaceId: string | null = null
    let docAuthorId: string | null = null
    if (documentId) {
      try {
        const docRows = await db.select({ workspace_id: documents.workspace_id, author_id: documents.author_id }).from(documents).where(eq(documents.id, documentId)).limit(1)
        if (docRows.length > 0) {
          // @ts-ignore
          workspaceId = docRows[0].workspace_id || null
          // @ts-ignore
          docAuthorId = docRows[0].author_id || null
        }
      } catch {}
    }

    // Build base where clause for prefix matching
    const whereClause = sql`(LOWER(${users.email}) LIKE ${pattern}) OR (LOWER(${users.name}) LIKE ${pattern})`

    if (workspaceId) {
      // Fetch workspace member users that match the prefix
      const rows = await db
        .select({ id: users.id, name: users.name, email: users.email, image: users.image })
        .from(users)
        .leftJoin(workspace_members, eq(workspace_members.user_id, users.id))
        .where(sql`(${workspace_members.workspace_id} = ${workspaceId}) AND (${whereClause})`)
        .limit(10)

      // Exclude existing collaborators for the document and the document author
      if (documentId) {
        const existing = await db.select({ id: document_collaborators.userId }).from(document_collaborators).where(eq(document_collaborators.documentId, documentId))
        const excluded = new Set(existing.map((r: any) => r.id))
        if (docAuthorId) excluded.add(docAuthorId)
        return (rows as any[]).filter(r => !excluded.has(r.id)).slice(0, 10)
      }

      return rows
    }

    // Fallback: global search across users when no workspace context
    const rows = await db
      .select({ id: users.id, name: users.name, email: users.email, image: users.image })
      .from(users)
      .where(whereClause)
      .limit(10)

    return rows
  } catch {
    return []
  }
}

// Return the current user's role for a given document
export async function getUserRoleForDocument(documentId: string) {
  const session = await getServerSession(topAuthOptions)
  if (!session?.user?.id) return { role: null }

  // Check ownership first
  try {
    const doc = await db.select({ id: documents.id, author_id: documents.author_id }).from(documents).where(eq(documents.id, documentId)).limit(1)
    if (doc.length > 0 && doc[0].author_id === session.user.id) {
      return { role: 'owner' }
    }
  } catch {}

  // Otherwise find collaborator entry
  try {
    const rows = await db
      .select({ role: document_collaborators.role })
      .from(document_collaborators)
      .where(and(eq(document_collaborators.documentId, documentId), eq(document_collaborators.userId, session.user.id)))
      .limit(1)

    if (rows.length === 0) return { role: null }
    return { role: rows[0].role }
  } catch {
    return { role: null }
  }
}

export async function removeCollaborator(documentId: string, userId: string) {
  try {
    // Require authentication and owner-only removal
    const session = await getServerSession(topAuthOptions)
    if (!session?.user?.id) {
      return { error: 'Authentication required.' }
    }

    // verify document exists and caller is owner
    const docRows = await db.select({ id: documents.id, author_id: documents.author_id }).from(documents).where(eq(documents.id, documentId)).limit(1)
    if (docRows.length === 0) return { error: 'Document not found.' }
    if (docRows[0].author_id !== session.user.id) return { error: 'Only the owner can remove collaborators.' }

    // Prevent removing the owner
    if (userId === docRows[0].author_id) return { error: 'Cannot remove the owner.' }

    await db.delete(document_collaborators).where(and(eq(document_collaborators.documentId, documentId), eq(document_collaborators.userId, userId)));
    try {
      revalidatePath(`/notes/${documentId}`);
      // Broadcast an enriched event: collaboratorRemoved with document and removed user id
      try {
        broadcastNotesUpdated(
          { type: 'collaboratorRemoved', documentId, removedUserId: userId },
          // Notify the owner and the removed collaborator (if still connected)
          [session.user.id, userId]
        )
      } catch {}
    } catch {}
    return { success: true };
  } catch {
    return { error: 'Failed to remove collaborator.' };
  }
}
