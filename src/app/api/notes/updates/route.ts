import { NextRequest } from 'next/server'
import Redis from 'ioredis'
import { redis as sharedRedis } from '@/lib/redis'

const NOTE_UPDATE_CHANNEL = 'note-updates'

function createSubscriber() {
  const url = ((sharedRedis as unknown as { options?: { url?: string } })?.options?.url) || process.env.UPSTASH_REDIS_REST_URL
  if (!url) {
    // During build or in environments without Redis, return a noop-compatible subscriber
    // The object implements the small subset of ioredis methods used in this route
    const noop = {
      subscribe: async () => {},
      on: () => {},
      off: () => {},
      unsubscribe: async () => {},
      quit: async () => {},
    }

    // Cast only because callers expect ioredis-like interface; the noop implements the used subset
    return noop as unknown as Redis
  }
  return new Redis(url)
}

export async function GET(req: NextRequest) {
  const subscriber = createSubscriber()

  const stream = new ReadableStream({
    start(controller) {
      // Handler for published messages
      const handleMessage = (channel: string, message: string) => {
        try {
          controller.enqueue(`data: ${message}\n\n`)
        } catch {
          // ignore enqueue errors
        }
      }

      // Subscribe and attach listener
      subscriber.subscribe(NOTE_UPDATE_CHANNEL).then(() => {
        // ioredis emits 'message' events for node-redis compatibility
        subscriber.on('message', handleMessage)
      }).catch((err: unknown) => {
        // If subscribe fails, close stream
        controller.error(err as Error)
      })

      // Cleanup when client disconnects
      const onAbort = async () => {
        try {
          subscriber.off('message', handleMessage)
          await subscriber.unsubscribe(NOTE_UPDATE_CHANNEL)
          subscriber.quit()
        } catch {
          // ignore cleanup errors
        }
        controller.close()
      }

      req.signal.addEventListener('abort', onAbort)
    }
  })

  const headers = new Headers({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
  return new Response(stream, { status: 200, headers })
}

export const runtime = 'nodejs'
