import { NextRequest } from 'next/server'
import { subscribe, unsubscribe } from '@/lib/realtime'

// SSE endpoint that uses the in-memory broadcaster. If deployed with a Redis
// server that supports pub/sub and realtime rebroadcasting, cross-instance
// events may be available; otherwise this provides single-instance SSE only.
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId') ?? undefined

  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller
      // Subscribe this controller for the optional userId or as a global listener
      subscribe(userId ?? '__global__', controller)
    },
    cancel() {
      if (controllerRef) {
        try { unsubscribe(userId ?? '__global__', controllerRef) } catch {}
        controllerRef = null
      }
    }
  })

  // When using the native Response streaming, ensure proper headers for SSE
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

export const runtime = 'nodejs'
