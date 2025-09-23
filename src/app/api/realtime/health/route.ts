import { getRealtimeHealth } from '@/lib/realtime'

export async function GET() {
  try {
    const health = getRealtimeHealth()
    return new Response(JSON.stringify(health), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ error: 'failed to get realtime health' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export const runtime = 'nodejs'
