import { NextResponse } from 'next/server'
import { subscribe, unsubscribe } from '@/lib/realtime'
import { getServerSession } from 'next-auth'
import { authOptions as topAuthOptions } from '@/lib/auth'

export async function GET(req: Request) {
  // Authenticate the subscriber using NextAuth session
  const session = await getServerSession(topAuthOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const userId = session.user.id as string

  let controllerRef: ReadableStreamDefaultController | null = null

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller
      subscribe(userId, controller)
      console.info(`[realtime route] client connected user=${userId}`)
      // Send initial comment to establish the stream
      controller.enqueue(new TextEncoder().encode(': connected\n\n'))
    },
    cancel() {
      if (controllerRef) {
        try { unsubscribe(userId, controllerRef); console.info(`[realtime route] client disconnected (cancel) user=${userId}`) } catch {}
      }
    }
  })

  // Ensure we unsubscribe when the client disconnects
  req.signal.addEventListener('abort', () => {
    if (controllerRef) {
      try { unsubscribe(userId, controllerRef); console.info(`[realtime route] client disconnected (abort) user=${userId}`) } catch {}
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    }
  })
}
