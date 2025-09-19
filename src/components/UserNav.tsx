'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import AuthDialog from './auth/AuthDialog';
import Spinner from './Spinner';

export function UserNav() {
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show spinner while loading or not mounted to prevent hydration mismatch
  if (!mounted || status === 'loading') {
    return (
      <div className="flex items-center gap-2">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!session ? (
        <>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="min-w-[80px]"
          >
            Sign In
          </Button>
          <AuthDialog open={isModalOpen} onOpenChange={setIsModalOpen} />
        </>
      ) : (
        <>
          <span className="text-sm text-muted-foreground truncate max-w-[120px]">
            Welcome, {session.user?.name || 'User'}
          </span>
          <Button 
            variant="outline" 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="min-w-[80px]"
          >
            Sign Out
          </Button>
        </>
      )}
    </div>
  );
}