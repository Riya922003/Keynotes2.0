'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronsLeft, FileText, Share, Settings, Plus, Search, Archive, Star, Users, Wrench } from 'lucide-react'

interface NavigationProps {
  children: React.ReactNode
}

export default function Navigation({ children }: NavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Check if it's mobile view (you can install a useMediaQuery hook or use this simple version)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle mouse enter - expand sidebar when collapsed
  const handleMouseEnter = () => {
    if (isCollapsed) {
      setIsHovering(true)
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }

  // Handle mouse leave - collapse sidebar after delay
  const handleMouseLeave = () => {
    if (isCollapsed) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovering(false)
      }, 300) // 300ms delay before collapsing
    }
  }

  // Toggle collapsed state
  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed)
    setIsHovering(false)
  }

  // Determine if sidebar should be expanded
  const isExpanded = !isCollapsed || isHovering

  // Sidebar navigation items
  const privateItems = [
    { icon: FileText, label: 'My Notes' },
    { icon: Star, label: 'Favorites' },
    { icon: Archive, label: 'Archive' },
    { icon: Plus, label: 'New Document' },
  ]

  const sharedItems = [
    { icon: Users, label: 'Team Workspace' },
    { icon: Share, label: 'Shared with me' },
    { icon: FileText, label: 'Collaboration' },
  ]

  const toolItems = [
    { icon: Search, label: 'Search' },
    { icon: Settings, label: 'Settings' },
    { icon: Wrench, label: 'Integrations' },
  ]

  return (
    <div className="flex min-h-full bg-background">
      {/* Sidebar */}
      <aside
        className={`
          ${isExpanded ? 'w-64' : 'w-16'} 
          ${isMobile ? 'fixed z-40' : 'relative'}
          bg-card border-r border-border transition-all duration-300 ease-in-out
          flex flex-col overflow-hidden min-h-full
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Collapse Button - moved to top without header section */}
        <div className="flex justify-end p-2 border-b border-border">
          <button
            onClick={toggleCollapsed}
            className={`
              p-2 rounded-lg hover:bg-accent transition-all duration-200
              ${isCollapsed ? 'rotate-180' : 'rotate-0'}
            `}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronsLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-6">
          {/* Private Section */}
          <div>
            <div className={`px-2 mb-3 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              {isExpanded && (
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Private
                </h3>
              )}
            </div>
            <nav className="space-y-1">
              {privateItems.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left group"
                  >
                    <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} flex-1 min-w-0`}>
                      {isExpanded && (
                        <span className="text-sm text-foreground truncate block">{item.label}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Shared Section */}
          <div>
            <div className={`px-2 mb-3 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              {isExpanded && (
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Shared
                </h3>
              )}
            </div>
            <nav className="space-y-1">
              {sharedItems.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left group"
                  >
                    <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} flex-1 min-w-0`}>
                      {isExpanded && (
                        <span className="text-sm text-foreground truncate block">{item.label}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tools Section */}
          <div>
            <div className={`px-2 mb-3 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              {isExpanded && (
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tools
                </h3>
              )}
            </div>
            <nav className="space-y-1">
              {toolItems.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left group"
                  >
                    <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} flex-1 min-w-0`}>
                      {isExpanded && (
                        <span className="text-sm text-foreground truncate block">{item.label}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden min-h-full">
        <div className="p-6 h-full">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </div>
  )
}