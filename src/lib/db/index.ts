import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = neon(databaseUrl);
export const db = drizzle(sql);

// Test connection function for debugging
export async function testDatabaseConnection() {
  try {
    const result = await sql`SELECT 1 as test`;
    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
}