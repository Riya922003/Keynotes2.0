'use client'

import { ThemeToggleButton } from './ThemeToggleButton'
import { UserNav } from './UserNav'

export function Header() {
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
          <ThemeToggleButton />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
