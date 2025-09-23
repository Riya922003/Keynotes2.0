"use server"

import { db } from '@/lib/db';
import { users, document_collaborators } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Server-only action to invite a user to collaborate on a note/document
export async function inviteUserToNote(documentId: string, inviteeEmail: string) {
  // Find the user by email
  const foundUsers = await db.select().from(users).where(eq(users.email, inviteeEmail)).limit(1);
  const user = foundUsers[0];

  if (!user) {
    return { error: 'User not found.' };
  }

  // Check if they are already a collaborator for this document
  const existing = await db
    .select()
    .from(document_collaborators)
    .where(and(eq(document_collaborators.userId, user.id), eq(document_collaborators.documentId, documentId)));

  if (existing.length > 0) {
    return { error: 'User is already a collaborator.' };
  }

  // Insert collaborator with role 'editor' by default
  await db.insert(document_collaborators).values({ documentId, userId: user.id, role: 'editor' });

  // Revalidate the note page so incremental static regeneration updates
  try {
    revalidatePath(`/notes/${documentId}`);
  } catch (_err) {
    // Swallow revalidation errors but continue (ignore in production/dev)
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
  } catch (err) {
      // swallow DB lookup errors and return null so UI falls back to id
    return null
  }
}
