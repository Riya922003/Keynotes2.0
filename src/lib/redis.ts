import Redis from 'ioredis'

const url = process.env.REDIS_URL

if (!url) {
  throw new Error('Missing REDIS_URL environment variable')
}

export const redis = new Redis(url, { tls: {} })

export default redis
