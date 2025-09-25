import { Redis } from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('Missing REDIS_URL environment variable');
}

// This is the TCP client that supports both publish and subscribe.
export const redis = new Redis(process.env.REDIS_URL, {
  tls: {
    // Only set rejectUnauthorized to false during development for self-signed certs.
    rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : undefined,
  },
});

// Publish wrapper: try ioredis publish first; if unavailable or it fails (e.g., serverless environment),
// fall back to Upstash REST client using UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
export async function publish(channel: string, message: string): Promise<number | null> {
  const forceRest = !!process.env.USE_UPSTASH_REST_ALWAYS

  // Try ioredis TCP publish when available and not forced to REST
  if (!forceRest) {
    try {
      const result = await redis.publish(channel, message)
      return result
    } catch (err: unknown) {
      console.error('[redis] ioredis publish failed, will attempt Upstash REST fallback', err)
    }
  }

  // Fallback to Upstash REST publish when configured
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.error('[redis] Upstash REST fallback not configured (missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN)')
    return null
  }

  try {
    // Use direct HTTP REST call to Upstash to avoid depending on @upstash/redis package
    // Upstash REST publish endpoint expects POST to `${url}/publish/${channel}` with Authorization: Bearer ${token}
  // Publish via Upstash REST when TCP publish is unavailable or forced
    const publishUrl = `${url.replace(/\/$/, '')}/publish/${encodeURIComponent(channel)}`
    const body = { message }

    // Use global fetch (Node 18+ / Next.js runtime provides fetch). Fallback to dynamic import('node-fetch') if unavailable.
    let fetchFn: typeof fetch
    if (typeof fetch !== 'undefined') {
      fetchFn = fetch
    } else {
      const nodeFetchModule = await import('node-fetch')
      // node-fetch exports the fetch function as the default export
      fetchFn = (nodeFetchModule as { default: typeof fetch }).default
    }

    const resp = await fetchFn(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      console.error('[redis] Upstash REST publish returned non-OK', resp.status, text)
      return null
    }

    type UpstashResp = { result?: number }
    const json = (await resp.json().catch(() => null)) as UpstashResp | null
    const result = json && typeof json.result === 'number' ? json.result : null
    return result
  } catch (err: unknown) {
    console.error('[redis] Upstash REST publish failed', err)
    return null
  }
}
