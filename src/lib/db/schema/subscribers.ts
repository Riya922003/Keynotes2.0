import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const subscribers = pgTable('subscribers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Subscriber = typeof subscribers.$inferSelect
export type NewSubscriber = typeof subscribers.$inferInsert