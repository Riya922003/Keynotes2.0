import { pgTable, text, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { workspaces } from './workspaces';

export const documentTypeEnum = pgEnum('document_type', ['note', 'journal']);

export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  type: documentTypeEnum('type').notNull(),
  title: text('title'),
  content: jsonb('content'),
  mood_score: integer('mood_score'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  author_id: text('author_id').notNull().references(() => users.id),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;