'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  
  // Don't show header on notes pages
  if (pathname.startsWith('/notes')) {
    return null
  }
  
  return <Header />
}