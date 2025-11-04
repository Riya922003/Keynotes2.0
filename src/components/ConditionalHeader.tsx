'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  
  // Don't show header on notes pages, dashboard, or journal
  if (pathname && (pathname.startsWith('/notes') || pathname.startsWith('/dashboard') || pathname.startsWith('/journal'))) {
    return null
  }
  
  return <Header />
}