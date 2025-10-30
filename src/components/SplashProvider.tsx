'use client'

import React, { createContext, useContext, useState } from 'react'
import SplashCursor from './SplashCursor'

type SplashContextType = {
  enabled: boolean
  toggle: () => void
  setEnabled: (v: boolean) => void
}

const SplashContext = createContext<SplashContextType | undefined>(undefined)

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false)

  const toggle = () => setEnabled(e => !e)

  return (
    <SplashContext.Provider value={{ enabled, toggle, setEnabled }}>
      {children}
      {enabled && <SplashCursor />}
    </SplashContext.Provider>
  )
}

export function useSplash() {
  const ctx = useContext(SplashContext)
  if (!ctx) throw new Error('useSplash must be used within a SplashProvider')
  return ctx
}

export default SplashProvider
