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
