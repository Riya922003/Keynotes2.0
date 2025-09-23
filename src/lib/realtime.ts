// Per-user in-memory SSE broadcaster
// Map of userId -> Set of ReadableStream controllers
const userControllers = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>()
const encoder = new TextEncoder()

import Redis from 'ioredis'
import { redis as sharedRedis } from '@/lib/redis'
import { unwrapEventPayload } from './hooks/eventPayload'

const NOTE_UPDATE_CHANNEL = 'note-updates'

// Monitoring state (module-scoped so we can export a health snapshot)
let _realtimeSubscriber: Redis | null = null
let _lastMessageAt: number | null = null
let _messageCount = 0
let _errorCount = 0
let _lastError: string | null = null
let _connectAttempts = 0

export function getRealtimeHealth() {
  return {
    connected: _realtimeSubscriber?.status === 'ready',
    status: _realtimeSubscriber?.status ?? 'unknown',
    lastMessageAt: _lastMessageAt,
    messageCount: _messageCount,
    errorCount: _errorCount,
    lastError: _lastError,
    connectAttempts: _connectAttempts,
  }
}

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

// Wire Redis subscriber to rebroadcast cross-instance updates with reconnect/backoff and monitoring
try {
  const url = ((sharedRedis as unknown as { options?: { url?: string } })?.options?.url) || process.env.UPSTASH_REDIS_REST_URL
  if (url) {
    // Create a Redis client with a retry strategy (exponential backoff capped)
    const subscriber = new Redis(url, {
      // reconnect attempts: exponential backoff
      retryStrategy(times: number) {
        _connectAttempts = times
        // exponential backoff up to 10s
        const delay = Math.min(1000 * Math.pow(2, times), 10000)
        return delay
      },
      // Enable auto-resubscribe and auto-reconnect behavior provided by ioredis
      autoResubscribe: true,
    })

    // Assign to module-scoped reference so health checks can access
    _realtimeSubscriber = subscriber

    // Attach lifecycle handlers for robust logging and monitoring
    subscriber.on('connect', () => {
      console.info('[realtime] redis connect')
    })

    subscriber.on('ready', () => {
      console.info('[realtime] redis ready')
    })

    subscriber.on('error', (err: unknown) => {
      _errorCount++
      _lastError = (err as Error)?.message || String(err)
      console.error('[realtime] redis error', err)
    })

    subscriber.on('close', () => {
      console.warn('[realtime] redis connection closed')
    })

    subscriber.on('reconnecting', () => {
      console.info('[realtime] redis reconnecting (attempts:', _connectAttempts, ')')
    })

    // Subscribe and handle messages
    subscriber.subscribe(NOTE_UPDATE_CHANNEL).then(() => {
      subscriber.on('message', (_channel: string, message: string) => {
        _messageCount++
        _lastMessageAt = Date.now()
        try {
          // Attempt to parse and normalize the message into our UpdatePayload
          let parsed: unknown = null
          try {
            parsed = JSON.parse(message)
          } catch {
            parsed = message
          }

          const normalized = unwrapEventPayload(parsed)
          if (normalized) {
            // If recipients are provided on the payload object, use them
            const recipients = (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).recipients)) ? (parsed as Record<string, unknown>).recipients as string[] : undefined
            if (recipients && recipients.length > 0) {
              broadcastNotesUpdated({ type: normalized.type, from: 'redis', payload: normalized }, recipients)
            } else {
              // Broadcast normalized payload to all
              broadcastNotesUpdated({ type: 'notesUpdated', from: 'redis', payload: normalized })
            }
          } else {
            // If we couldn't normalize, broadcast the original message for backward compatibility
            broadcastNotesUpdated({ type: 'notesUpdated', from: 'redis', payload: message })
          }
        } catch (_e: unknown) {
          _errorCount++
          _lastError = (_e as Error)?.message || String(_e)
          broadcastNotesUpdated({ type: 'notesUpdated', from: 'redis', payload: message })
        }
      })
    }).catch((_err: unknown) => {
      // Log subscribe failures but don't crash startup
      _errorCount++
      _lastError = (_err as Error)?.message || String(_err)
      console.error('Failed to subscribe to Redis note-updates channel', _err)
    })
  }
} catch (_e: unknown) {
  console.error('Error setting up Redis subscriber for realtime rebroadcast:', _e)
}
