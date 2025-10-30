'use client'

import { ThemeProvider } from './ThemeProvider'
import AuthProvider from './AuthProvider'
import { SplashProvider } from './SplashProvider'

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  // Always render the providers, even during hydration
  return (
    <ThemeProvider>
      <AuthProvider>
        <SplashProvider>
          {children}
        </SplashProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}