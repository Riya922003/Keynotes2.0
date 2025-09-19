'use client'

import { ThemeProvider } from './ThemeProvider'
import AuthProvider from './AuthProvider'

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  // Always render the providers, even during hydration
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}