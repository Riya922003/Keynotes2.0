'use client'

import { usePathname } from 'next/navigation'
import Footer from './landing/Footer'

export default function ConditionalFooter() {
  const pathname = usePathname()
  
  // Don't show footer on dashboard or notes pages
  if (pathname && (pathname.startsWith('/dashboard') || pathname.startsWith('/notes'))) {
    return null
  }
  
  return <Footer />
}