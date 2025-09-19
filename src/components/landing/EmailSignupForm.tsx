'use client'

import { useEffect, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { subscribeToAction } from '@/app/actions/subscribeAction'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const initialState = {
  success: false,
  message: ''
}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      disabled={pending}
      className="w-full sm:w-auto"
    >
      {pending ? 'Subscribing...' : 'Subscribe'}
    </Button>
  )
}

export default function EmailSignupForm() {
  const [state, formAction] = useActionState(subscribeToAction, initialState)
  const { toast } = useToast()

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success!' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      })
    }
  }, [state, toast])

  return (
    <div className="w-full max-w-md mx-auto">
      <form action={formAction} className="flex flex-col sm:flex-row gap-3">
        <Input
          name="email"
          type="email"
          placeholder="Enter your email address"
          required
          className="flex-1"
        />
        <SubmitButton />
      </form>
    </div>
  )
}