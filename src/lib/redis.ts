import { Redis } from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('Missing REDIS_URL environment variable. Please check your .env.local file.');
}

// This is the single, reliable TCP client that supports both publish and subscribe.
// The tls object is a workaround for local development environment certificate issues.
export const redis = new Redis(process.env.REDIS_URL, {
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : undefined,
  }
});