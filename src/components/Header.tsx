'use client'

import { ThemeToggleButton } from './ThemeToggleButton'
import { UserNav } from './UserNav'
import { Sparkles } from 'lucide-react'
import { useSplash } from './SplashProvider'

export function Header() {
  const { enabled, toggle } = useSplash()

  return (
    <header className="border-b sticky top-0 z-20 bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold">Keynotes</h1>
        
        <nav className="hidden md:flex gap-8 absolute left-1/2 transform -translate-x-1/2">
          <a href="#" className="text-base font-medium text-muted-foreground hover:text-primary transition">Home</a>
          <a href="#features" className="text-base font-medium text-muted-foreground hover:text-primary transition">Features</a>
          <a href="#community" className="text-base font-medium text-muted-foreground hover:text-primary transition">Community</a>
          <a href="#pricing" className="text-base font-medium text-muted-foreground hover:text-primary transition">Pricing</a>
        </nav>
        
        <div className="flex items-center gap-4">
          {/* Sparkle toggle placed beside theme toggle */}
          <div className="relative group">
            <button
              onClick={toggle}
                aria-describedby="splash-tooltip"
                className={`shrink-0 px-2.5 py-1.5 border-2 rounded-md transition-all duration-200 flex items-center gap-1 ${enabled ? 'border-purple-600 bg-purple-50' : 'border-purple-500 bg-white hover:bg-purple-100'}`}
                style={{ minWidth: '56px', minHeight: '34px' }}
              aria-pressed={enabled}
            >
              <Sparkles className="w-5 h-5 text-purple-600" />
            </button>
            {/* Simple tooltip */}
            <span
              id="splash-tooltip"
              role="status"
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-8 opacity-0 scale-95 transform rounded-md bg-muted/90 text-sm text-muted-foreground px-2 py-1 transition-all duration-150 group-hover:opacity-100"
            >
              Toggle splash effect
            </span>
          </div>
          <ThemeToggleButton />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
