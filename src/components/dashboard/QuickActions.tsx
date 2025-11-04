'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function QuickActions() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <Link 
        href="/notes"
        onClick={() => setLoadingAction('notes')}
        className="block w-full p-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors text-center relative"
      >
        {loadingAction === 'notes' ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </span>
        ) : (
          'Create New Note'
        )}
      </Link>
      <Link 
        href="/journal"
        onClick={() => setLoadingAction('journal')}
        className="block w-full p-3 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors text-center relative"
      >
        {loadingAction === 'journal' ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </span>
        ) : (
          'Start Journal Entry'
        )}
      </Link>
      <button className="w-full p-3 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors">
        Browse Templates
      </button>
    </div>
  )
}
