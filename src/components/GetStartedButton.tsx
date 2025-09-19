'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import AuthDialog from './auth/AuthDialog'

export default function GetStartedButton() {
  const [mounted, setMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button 
        size="lg" 
        className="text-lg px-8 py-6"
      >
        Get Started for Free
      </Button>
    )
  }

  return (
    <>
      <Button 
        size="lg" 
        className="text-lg px-8 py-6"
        onClick={() => setIsModalOpen(true)}
      >
        Get Started for Free
      </Button>
      <AuthDialog open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}