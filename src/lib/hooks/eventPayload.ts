import { NoteSummary } from '@/types/note'

type NoteUpdateType =
  | 'noteCreated'
  | 'noteUpdated'
  | 'noteDeleted'
  | 'notesReordered'

export type UpdatePayload = {
  type: NoteUpdateType
  note?: NoteSummary | null
  noteId?: string
  recipients?: string[]
}

// A robust unwrap helper for EventSource / Redis payloads.
// Accepts unknown input (string, object) and will attempt to JSON.parse
// then normalize several historical wrapper shapes into the canonical UpdatePayload.
export function unwrapEventPayload(raw: unknown): UpdatePayload | null {
  let obj: unknown = raw
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw)
    } catch {
      return null
    }
  }

  if (!obj || typeof obj !== 'object') return null

  const o = obj as Record<string, unknown>

  // Legacy rebroadcaster wrapper: { type: 'notesUpdated', payload }
  if (o.type === 'notesUpdated' && o.payload && typeof o.payload === 'object') {
    const p = o.payload as Record<string, unknown>
    if (p.type && typeof p.type === 'string') return p as UpdatePayload
    return null
  }

  // Another wrapper shape: { type, from: 'redis', payload }
  if (o.payload && typeof o.payload === 'object') {
    const p = o.payload as Record<string, unknown>
    if (p.type && typeof p.type === 'string') return p as UpdatePayload
  }

  // If the object already looks like an UpdatePayload (has a type)
  if (o.type && typeof o.type === 'string') {
    return o as UpdatePayload
  }

  return null
}
