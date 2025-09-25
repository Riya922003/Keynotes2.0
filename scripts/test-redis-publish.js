// Quick test script to publish a message to the configured REDIS_URL
// Loads .env automatically via node -r dotenv/config
const Redis = require('ioredis');

if (!process.env.REDIS_URL) {
  console.error('Missing REDIS_URL in env');
  process.exit(1);
}

console.log('Using REDIS_URL:', process.env.REDIS_URL.replace(/:(.*)@/, ':<redacted>@'));

const client = new Redis(process.env.REDIS_URL, {
  tls: {
    // For local dev we allow insecure certs; this mirrors the app behavior
    rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : undefined,
  },
});

client.on('connect', () => console.log('[test] redis connect'));
client.on('ready', () => console.log('[test] redis ready'));
client.on('error', (err) => console.error('[test] redis error', err));
client.on('close', () => console.log('[test] redis close'));

(async () => {
  try {
    const channel = 'note-updates'
    const payload = JSON.stringify({ test: 'hello', ts: Date.now() })
    console.log('[test] publishing ->', channel, payload)
    const res = await client.publish(channel, payload)
    console.log('[test] publish result:', res)
  } catch (err) {
    console.error('[test] publish failed', err)
  } finally {
    client.disconnect()
  }
})();
