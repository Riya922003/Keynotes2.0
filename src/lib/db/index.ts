import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

console.log('Initializing database connection to:', new URL(databaseUrl).hostname);

const sql = neon(databaseUrl);
export const db = drizzle(sql);

// Test connection function for debugging
export async function testDatabaseConnection() {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection test successful');
    return { success: true, result };
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return { success: false, error };
  }
}