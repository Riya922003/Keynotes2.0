import { NextResponse } from 'next/server'
import { getSidebarCounts } from '@/app/actions/noteActions'

export async function GET() {
  try {
    const counts = await getSidebarCounts()
    return NextResponse.json(counts)
  } catch {
    return NextResponse.json({ error: 'Unable to fetch counts' }, { status: 500 })
  }
}
