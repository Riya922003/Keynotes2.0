'use client'

import { usePathname } from 'next/navigation'
import Footer from './landing/Footer'

export default function ConditionalFooter() {
  const pathname = usePathname()
  
  // Don't show footer on dashboard, notes pages, or journal
  if (pathname && (pathname.startsWith('/dashboard') || pathname.startsWith('/notes') || pathname.startsWith('/journal'))) {
    return null
  }
  
  return <Footer />
}