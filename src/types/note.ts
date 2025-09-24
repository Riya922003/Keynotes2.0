export type NoteSummary = {
  id: string
  title: string | null
  content: unknown
  type: 'note' | 'journal'
  created_at: string | Date | null
  updated_at: string | Date | null
  author_id: string
  workspace_id: string
  color?: string | null
  is_pinned?: boolean | null
  is_archived?: boolean | null
  is_starred?: boolean | null

  reminder_date?: string | Date | null
  reminder_repeat?: string | null
  position?: number | null
}
