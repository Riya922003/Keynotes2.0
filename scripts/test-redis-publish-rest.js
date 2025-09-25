// Self-contained test script that attempts to publish via ioredis (TCP) first
// and falls back to Upstash REST. Set USE_UPSTASH_REST_ALWAYS=1 to force REST.
// Usage: node -r dotenv/config scripts/test-redis-publish-rest.js

// Do not require ioredis at top-level (it may be ESM-only). Require it lazily below when needed.
(async () => {
  const forceRest = !!process.env.USE_UPSTASH_REST_ALWAYS
  const redisUrl = process.env.REDIS_URL
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  const channel = 'note-updates'
  const payload = JSON.stringify({ test: 'rest-fallback', ts: Date.now() })

  if (!forceRest && redisUrl) {
    console.log('[test-rest] attempting ioredis (TCP) publish')
    try {
      let Redis
      try {
        Redis = require('ioredis')
      } catch (e) {
        console.warn('[test-rest] require(ioredis) failed, falling back to REST', e && e.message)
      }

      if (!Redis) throw new Error('ioredis not available')

      const client = new Redis(redisUrl, {
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : undefined,
        },
      })
      client.on('error', (e) => console.error('[test-rest] ioredis error', e))
      const res = await client.publish(channel, payload)
      console.log('[test-rest] ioredis publish result:', res)
      client.disconnect()
      return
    } catch (err) {
      console.error('[test-rest] ioredis publish failed, will attempt Upstash REST fallback', err)
    }
  } else if (forceRest) {
    console.log('[test-rest] USE_UPSTASH_REST_ALWAYS set — forcing REST fallback')
  } else {
    console.log('[test-rest] REDIS_URL not set or forceRest true — using REST fallback')
  }

  // REST fallback
  if (!upstashUrl || !upstashToken) {
    console.error('[test-rest] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in env')
    process.exit(2)
  }

  try {
    const publishUrl = `${upstashUrl.replace(/\/$/, '')}/publish/${encodeURIComponent(channel)}`
    console.log('[test-rest] POST', publishUrl.replace(/:\/\/[^@]*@/, '://<redacted>@'))

    const fetchFn = (typeof fetch !== 'undefined') ? fetch : (() => {
      try { return require('node-fetch') } catch (e) { throw new Error('fetch not available and node-fetch not installed') }
    })()

    const resp = await fetchFn(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${upstashToken}`,
      },
      body: JSON.stringify({ message: payload }),
    })

    const text = await resp.text()
    console.log('[test-rest] status=', resp.status)
    console.log('[test-rest] body=', text)
    try {
      const json = JSON.parse(text)
      console.log('[test-rest] result=', json.result)
    } catch (_) {
      // ignore
    }
  } catch (err) {
    console.error('[test-rest] Upstash REST publish failed', err)
    process.exit(1)
  }
})()
