// Per-user in-memory SSE broadcaster
// Map of userId -> Set of ReadableStream controllers
const userControllers = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>()
const encoder = new TextEncoder()

function ensureSet(userId: string) {
  if (!userControllers.has(userId)) userControllers.set(userId, new Set())
  return userControllers.get(userId)!
}

export function subscribe(userId: string, controller: ReadableStreamDefaultController<Uint8Array>) {
  ensureSet(userId).add(controller)
}

export function unsubscribe(userId: string, controller: ReadableStreamDefaultController<Uint8Array>) {
  const s = userControllers.get(userId)
  if (!s) return
  s.delete(controller)
  if (s.size === 0) userControllers.delete(userId)
}

function formatSSE(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  return encoder.encode(payload)
}

// Broadcast to a list of userIds; if recipients omitted, broadcast to all connected users
export function broadcastNotesUpdated(payload: unknown = { type: 'notesUpdated', ts: Date.now() }, recipients?: string[]) {
  const chunk = formatSSE('notesUpdated', payload)

  if (!recipients || recipients.length === 0) {
    // broadcast to all
    for (const [, controllers] of userControllers) {
      for (const controller of Array.from(controllers)) {
        try { controller.enqueue(chunk) } catch { controllers.delete(controller) }
      }
    }
    return
  }

  for (const uid of recipients) {
    const controllers = userControllers.get(uid)
    if (!controllers) continue
    for (const controller of Array.from(controllers)) {
      try { controller.enqueue(chunk) } catch { controllers.delete(controller) }
    }
  }
}

// Periodic ping to keep connections alive across all controllers
setInterval(() => {
  const ping = encoder.encode(': ping\n\n')
  for (const [, controllers] of userControllers) {
    for (const controller of Array.from(controllers)) {
      try { controller.enqueue(ping) } catch { controllers.delete(controller) }
    }
  }
}, 20000)

export const realtime = {}

import { redis as sharedRedis } from '@/lib/redis'
import { unwrapEventPayload } from './hooks/eventPayload'

// Minimal interface describing the methods we use from ioredis-like clients
interface RedisLike {
  duplicate?: () => RedisLike
  subscribe?: (channel: string) => Promise<number>
  on?: (event: 'connect' | 'ready' | 'error' | 'close' | 'reconnecting' | 'message', cb: (...args: unknown[]) => void) => void
  status?: string
}

const NOTE_UPDATE_CHANNEL = 'note-updates'

// Monitoring state (module-scoped so we can export a health snapshot)
let _realtimeSubscriber: unknown | null = null
let _lastMessageAt: number | null = null
let _messageCount = 0
let _errorCount = 0
let _lastError: string | null = null
let _connectAttempts = 0

export function getRealtimeHealth() {
  const subs = _realtimeSubscriber as RedisLike | null
  return {
    connected: subs?.status === 'ready',
    status: subs?.status ?? 'unknown',
    lastMessageAt: _lastMessageAt,
    messageCount: _messageCount,
    errorCount: _errorCount,
    lastError: _lastError,
    connectAttempts: _connectAttempts,
  }
}

// Wire Redis subscriber to rebroadcast cross-instance updates with reconnect/backoff and monitoring
try {
  // If the shared Redis client exposes duplicate/subscribe/on methods (ioredis-like), create or use a subscriber
  const client = sharedRedis as RedisLike
  let subscriber: RedisLike | null = null

  if (client && typeof client.duplicate === 'function') {
    // duplicate to get an isolated connection for pub/sub
    subscriber = client.duplicate!()
  } else if (client && typeof client.subscribe === 'function' && typeof client.on === 'function') {
    subscriber = client
  }

  if (subscriber) {
    _realtimeSubscriber = subscriber as unknown

    subscriber.on?.('connect', () => console.info('[realtime] redis connect'))
    subscriber.on?.('ready', () => console.info('[realtime] redis ready'))
    subscriber.on?.('error', (err: unknown) => {
      _errorCount++
      _lastError = (err as Error)?.message || String(err)
      console.error('[realtime] redis error', err)
    })
    subscriber.on?.('close', () => console.warn('[realtime] redis connection closed'))
    subscriber.on?.('reconnecting', () => {
      _connectAttempts++
      console.info('[realtime] redis reconnecting (attempts:', _connectAttempts, ')')
    })

    // Subscribe and handle messages
    subscriber.subscribe!(NOTE_UPDATE_CHANNEL).then(() => {
      subscriber.on?.('message', (...args: unknown[]) => {
        _messageCount++
        _lastMessageAt = Date.now()
        try {
          const message = typeof args[1] === 'string' ? args[1] : typeof args[0] === 'string' ? args[0] : ''
          let parsed: unknown = null
          try { parsed = JSON.parse(message) } catch { parsed = message }
          const normalized = unwrapEventPayload(parsed)
          if (normalized) {
            const recipients = (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).recipients)) ? (parsed as Record<string, unknown>).recipients as string[] : undefined
            if (recipients && recipients.length > 0) {
              broadcastNotesUpdated({ type: normalized.type, from: 'redis', payload: normalized }, recipients)
            } else {
              broadcastNotesUpdated({ type: 'notesUpdated', from: 'redis', payload: normalized })
            }
          } else {
            broadcastNotesUpdated({ type: 'notesUpdated', from: 'redis', payload: message })
          }
        } catch (_e: unknown) {
          _errorCount++
          _lastError = (_e as Error)?.message || String(_e)
          const msg = typeof args[1] === 'string' ? args[1] : typeof args[0] === 'string' ? args[0] : ''
          broadcastNotesUpdated({ type: 'notesUpdated', from: 'redis', payload: msg })
        }
      })
    }).catch((_err: unknown) => {
      _errorCount++
      _lastError = (_err as Error)?.message || String(_err)
      console.error('Failed to subscribe to Redis note-updates channel', _err)
    })
  } else {
    // Pub/sub not available (e.g., Upstash REST client). Log and continue without realtime subscriber.
    console.info('[realtime] Redis client does not support pub/sub in this environment; realtime rebroadcast disabled')
  }
} catch (_e: unknown) {
  console.error('Error setting up Redis subscriber for realtime rebroadcast:', _e)
}
