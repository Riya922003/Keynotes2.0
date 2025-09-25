// Direct test of Upstash REST publish without importing TypeScript files
// Usage: node -r dotenv/config scripts/test-upstash-rest-direct.js

(async () => {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in env')
    process.exit(2)
  }

  const channel = 'note-updates'
  const payload = { test: 'direct-rest', ts: Date.now() }
  const publishUrl = `${url.replace(/\/$/, '')}/publish/${encodeURIComponent(channel)}`
  console.log('[direct-rest] POST', publishUrl.replace(/:\/\/[^@]*@/, '://<redacted>@'))

  try {
    const resp = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: JSON.stringify(payload) }),
    })

    const text = await resp.text()
    console.log('[direct-rest] status=', resp.status)
    console.log('[direct-rest] body=', text)
    try {
      const json = JSON.parse(text)
      console.log('[direct-rest] result=', json.result)
    } catch (e) {
      // ignore
    }
  } catch (err) {
    console.error('[direct-rest] request failed', err)
    process.exit(1)
  }
})()
