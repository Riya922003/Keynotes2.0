import { useEffect, useRef } from 'react'
import { unwrapEventPayload } from './eventPayload'
import type { UpdatePayload } from './eventPayload'

// Re-export for backwards compatibility
export { unwrapEventPayload as parseEventData }
// Re-export the UpdatePayload type for consumers that import it from this hook
export type { UpdatePayload } from './eventPayload'

export default function useNoteUpdates(onUpdate: (data: UpdatePayload) => void) {
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const es = new EventSource('/api/notes/updates')
    esRef.current = es

    const handler = (e: MessageEvent) => {
      const raw: unknown = typeof e.data === 'string' ? e.data : JSON.stringify(e.data)
      const maybe = unwrapEventPayload(raw)
      if (maybe) return onUpdate(maybe)

      // Fallback: try parsing text, but keep types safe
      try {
        const parsed: unknown = JSON.parse(typeof raw === 'string' ? raw : String(raw)) as unknown
        const fromParsed = unwrapEventPayload(parsed)
        if (fromParsed) return onUpdate(fromParsed)
      } catch {
        // ignore parse errors
      }

      // Last resort: ignore unknown payloads — consumer may fetch full list
    }

    es.addEventListener('message', handler)

    es.addEventListener('error', () => {
      // EventSource will attempt reconnection automatically; log for debugging if needed
    })

    return () => {
      es.removeEventListener('message', handler)
      es.close()
      esRef.current = null
    }
  }, [onUpdate])
}
