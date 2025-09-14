'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import AuthDialog from './auth/AuthDialog';
import Spinner from './Spinner';

export function UserNav() {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Show spinner while loading
  if (status === 'loading') {
    return <Spinner />;
  }

  return (
    <div className="flex items-center gap-2">
      {!session ? (
        <>
          <Button onClick={() => setIsModalOpen(true)}>
            Sign In
          </Button>
          <AuthDialog open={isModalOpen} onOpenChange={setIsModalOpen} />
        </>
      ) : (
        <>
          <span className="text-sm text-muted-foreground">
            Welcome, {session.user?.name || 'User'}
          </span>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: '/' })}>
            Sign Out
          </Button>
        </>
      )}
    </div>
  );
}