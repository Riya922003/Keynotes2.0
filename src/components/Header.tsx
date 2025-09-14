'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import AuthDialog from './auth/AuthDialog'

export function Header() {
  const { data: session } = useSession()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <header className="border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold">Keynotes</h1>
        {!session && (
          <Button onClick={() => setIsModalOpen(true)}>
            Sign In
          </Button>
        )}
      </div>
      <AuthDialog open={isModalOpen} onOpenChange={setIsModalOpen} />
    </header>
  );
}
