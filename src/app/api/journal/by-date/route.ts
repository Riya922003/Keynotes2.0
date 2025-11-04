import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { eq, sql, and } from 'drizzle-orm'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const url = new URL(request.url)
  const date = url.searchParams.get('date') // expected YYYY-MM-DD
  if (!date) return NextResponse.json({ error: 'Missing date param' }, { status: 400 })

  try {
    const entries = await db.select().from(documents).where(and(
      eq(documents.author_id, session.user.id),
      eq(documents.type, 'journal'),
      sql`to_char(${documents.created_at}, 'YYYY-MM-DD') = ${date}`
    )).limit(1)

    if (!entries || entries.length === 0) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({ found: true, entry: entries[0] })
  } catch (err) {
    console.error('Error fetching journal entry by date:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
