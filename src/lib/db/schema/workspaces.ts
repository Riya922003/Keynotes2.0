import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  owner_id: text('owner_id').notNull().references(() => users.id),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;