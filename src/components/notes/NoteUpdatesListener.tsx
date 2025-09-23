"use client"

import { useRouter } from 'next/navigation'
import useNoteUpdates from '@/lib/hooks/useNoteUpdates'

export default function NoteUpdatesListener() {
  const router = useRouter()

  useNoteUpdates(() => {
    // Refresh server data when an update arrives
    try {
      router.refresh()
    } catch {
      // ignore
    }
  })

  return null
}
