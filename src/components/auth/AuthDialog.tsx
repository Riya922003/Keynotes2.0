'use client'

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import LoginForm from "./LoginForm"
import RegisterForm from "./RegisterForm"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [view, setView] = useState<'login' | 'register'>('login')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {view === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <DialogDescription>
            {view === 'login' 
              ? 'Sign in to your account to continue.'
              : 'Create a new account to get started.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {view === 'login' ? (
            <LoginForm />
          ) : (
            <RegisterForm />
          )}
        </div>
        
        <DialogFooter className="flex-col space-y-2">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setView(view === 'login' ? 'register' : 'login')}
          >
            {view === 'login' 
              ? "Don't have an account? Sign Up" 
              : "Already have an account? Sign In"
            }
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}