'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import AuthDialog from './auth/AuthDialog'

export default function GetStartedButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

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