import Redis from 'ioredis'

const url = process.env.UPSTASH_REDIS_REST_URL

// If the environment variable is not present (e.g., local dev or during build),
// avoid throwing so the app can still build and run in environments without Redis.
// Export `redis` as `Redis | null` so callers can guard accordingly.
export const redis: Redis | null = url ? new Redis(url) : null

export default redis
