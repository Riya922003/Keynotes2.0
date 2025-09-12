import { pgTable, serial, text, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { workspaces } from './workspaces';

export const workspaceMemberRoleEnum = pgEnum('workspace_member_role', ['owner', 'editor']);

export const workspace_members = pgTable('workspace_members', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
  role: workspaceMemberRoleEnum('role').notNull(),
});

export type WorkspaceMember = typeof workspace_members.$inferSelect;
export type NewWorkspaceMember = typeof workspace_members.$inferInsert;