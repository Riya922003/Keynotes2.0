import { pgTable, text, serial, pgEnum } from 'drizzle-orm/pg-core';
import { documents } from './documents';
import { users } from './users';

export const collaboratorRoleEnum = pgEnum('collaborator_role', ['editor', 'viewer']);

export const document_collaborators = pgTable('document_collaborators', {
  id: serial('id').primaryKey(),
  documentId: text('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: collaboratorRoleEnum('role').notNull(),
});

export type DocumentCollaborator = typeof document_collaborators.$inferSelect;
export type NewDocumentCollaborator = typeof document_collaborators.$inferInsert;
