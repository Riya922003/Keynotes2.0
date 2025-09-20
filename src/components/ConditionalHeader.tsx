'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  
  // Don't show header on notes pages or dashboard
  if (pathname.startsWith('/notes') || pathname.startsWith('/dashboard')) {
    return null
  }
  
  return <Header />
}