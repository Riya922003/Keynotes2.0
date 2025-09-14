'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function GetStartedButton() {
  return (
    <Button 
      size="lg" 
      className="text-lg px-8 py-6"
      onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
    >
      Get Started for Free
    </Button>
  )
}