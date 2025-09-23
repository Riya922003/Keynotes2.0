import { NextResponse } from 'next/server'
import { getUserAndSharedNotes } from '@/app/actions/noteActions'

export async function GET() {
  try {
    const data = await getUserAndSharedNotes()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}
