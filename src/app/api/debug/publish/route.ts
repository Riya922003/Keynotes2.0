import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

// Protected debug endpoint to trigger a publish from the running server.
// Usage (server only): POST /api/debug/publish with header X-Debug-Token matching
// DEBUG_PUBLISH_SECRET and JSON body { channel, message }.

export async function POST(req: Request) {
  const secret = process.env.DEBUG_PUBLISH_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'DEBUG_PUBLISH_SECRET not configured' }, { status: 500 })
  }

  const header = req.headers.get('x-debug-token')
  if (!header || header !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Basic runtime validation
  const maybe = (body as Record<string, unknown> | null)
  const channel = maybe?.channel
  const message = maybe?.message
  if (typeof channel !== 'string' || typeof message !== 'string') {
    return NextResponse.json({ error: 'Expecting { channel: string, message: string }' }, { status: 400 })
  }

  try {
  console.log('[debug/publish] publishing ->', channel, message)
  const result = await redis.publish(channel, message)
  console.log('[debug/publish] publish result ->', result)
    return NextResponse.json({ result })
  } catch (err) {
    console.error('[debug/publish] publish error', err)
    return NextResponse.json({ error: 'Publish failed', details: String(err) }, { status: 500 })
  }
}
