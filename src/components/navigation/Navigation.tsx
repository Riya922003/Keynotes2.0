 'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SearchBar from '@/components/search/SearchBar'
import { getSidebarCounts } from '@/app/actions/noteActions'
import { onNotesUpdated } from '@/lib/notesSync'
import { ChevronsLeft, FileText, Share, Settings, Archive, Star, Users, Wrench, Home, BookHeart, Loader2 } from 'lucide-react'
// Accordion removed — journal archive moved to calendar

interface NavigationProps {
  children: React.ReactNode
}

export default function Navigation({ children }: NavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [loadingLink, setLoadingLink] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Check if it's mobile view (you can install a useMediaQuery hook or use this simple version)
  const [isMobile, setIsMobile] = useState(false)

  // Router + search state for sidebar search input
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState<string>(searchParams?.get('q') ?? '')

  // Keep URL in sync when searchValue changes
  const updateQuery = (q: string) => {
    try {
      const params = new URLSearchParams(searchParams?.toString() || '')
      if (q) params.set('q', q)
      else params.delete('q')
      const url = `${typeof window !== 'undefined' ? window.location.pathname : '/notes'}?${params.toString()}`
      router.replace(url)
      setSearchValue(q)
    } catch {}
  }

  // Fetch counts from server action
  const fetchCounts = async () => {
    try {
      const res = await getSidebarCounts()
      if (res) {
        setNotesCount(res.notesCount ?? 0)
        setArchivedCount(res.archivedCount ?? 0)
        setStarredCount(res.starredCount ?? 0)
        setSharedCount(res.sharedCount ?? 0)
      }
    } catch {
      // Fail silently - counts are non-critical
    }
  }

  useEffect(() => {
    // Fetch initial counts when component mounts
    fetchCounts()

    // Setup subscription for real-time updates with debounce (supports cross-tab via BroadcastChannel)
    let debounceTimeout: number | null = null
    const handler = () => {
      if (debounceTimeout) {
        window.clearTimeout(debounceTimeout)
      }
      debounceTimeout = window.setTimeout(() => {
        fetchCounts()
        debounceTimeout = null
      }, 200)
    }

    const unsubscribe = onNotesUpdated(handler)

    return () => {
      if (debounceTimeout) {
        window.clearTimeout(debounceTimeout)
      }
      try { unsubscribe() } catch {}
    }
  }, [])

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
    const newState = !isCollapsed
    setIsCollapsed(newState)
    setIsHovering(false)
    // When closing the sidebar, clear any active search so notes return to normal
    if (newState) {
      try { updateQuery('') } catch {}
    }
  }

  // Determine if sidebar should be expanded
  const isExpanded = !isCollapsed || isHovering

  // Sidebar navigation items
  // counts state for dynamic sidebar
  const [notesCount, setNotesCount] = useState<number | undefined>(undefined)
  const [archivedCount, setArchivedCount] = useState<number | undefined>(undefined)
  const [starredCount, setStarredCount] = useState<number | undefined>(undefined)
  const [sharedCount, setSharedCount] = useState<number | undefined>(undefined)
  

  // Sidebar items - organized by section
  const notesItems = [
    { icon: FileText, label: 'My Notes', count: notesCount },
    { icon: Star, label: 'Starred', count: starredCount },
    { icon: Archive, label: 'Archived', count: archivedCount },
  ]

  const journalItems = [
    { icon: BookHeart, label: 'My Journal', count: undefined },
  ]

  const sharedItems = [
    { icon: Users, label: 'Team Workspace' },
    { icon: Share, label: 'Shared with me', count: sharedCount },
    { icon: FileText, label: 'Collaboration' },
  ]

  const toolItems = [
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
        <div className="flex items-center justify-between p-2 border-b border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg hover:bg-accent transition-all duration-200"
              aria-label="Go to dashboard"
              title="Dashboard"
            >
              <Home className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div>
            <button
              onClick={toggleCollapsed}
              className={
                `rounded-lg hover:bg-accent transition-all duration-200 ${isCollapsed ? 'pl-4 pr-0 py-3' : 'p-3'} ${isCollapsed ? 'rotate-180' : 'rotate-0'}`
              }
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronsLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-6">
          {/* Sidebar Search (syncs q param so pages can react) */}
          <div className={`px-2 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
            {isExpanded && (
              <div className="mb-2">
                <SearchBar value={searchValue} onChangeAction={(v) => updateQuery(v)} />
              </div>
            )}
          </div>
          {/* Notes Section */}
          <div>
            <div className={`px-2 mb-3 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              {isExpanded && (
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Notes
                </h3>
              )}
            </div>
            <nav className="space-y-1">
              {notesItems.map((item, index) => {
                const IconComponent = item.icon
                // Determine href based on label
                let href = '/notes'
                if (item.label === 'My Notes') {
                  href = '/notes'
                } else if (item.label === 'Starred') {
                  href = '/notes?filter=starred'
                } else if (item.label === 'Archived') {
                  href = '/notes?filter=archived'
                }
                
                const isLinkLoading = loadingLink === href
                
                return (
                  <Link
                    key={index}
                    href={href}
                    onClick={() => setLoadingLink(href)}
                  >
                    <div
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left group"
                      aria-label={item.label}
                    >
                      {isLinkLoading ? (
                        <Loader2 className="h-4 w-4 text-muted-foreground flex-shrink-0 animate-spin" />
                      ) : (
                        <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} flex-1 min-w-0`}>
                        {isExpanded && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground truncate block">{item.label}</span>
                            {isLinkLoading ? (
                              <Loader2 className="ml-2 h-3 w-3 text-muted-foreground animate-spin" />
                            ) : (
                              <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                                {typeof item.count === 'number' ? item.count : '—'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Journal Section */}
          <div>
            <div className={`px-2 mb-3 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              {isExpanded && (
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Journal
                </h3>
              )}
            </div>
            <nav className="space-y-1">
              {journalItems.map((item, index) => {
                const IconComponent = item.icon
                const href = '/journal'
                const isLinkLoading = loadingLink === href
                
                return (
                  <Link
                    key={index}
                    href={href}
                    onClick={() => setLoadingLink(href)}
                  >
                    <div
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left group"
                      aria-label={item.label}
                    >
                      {isLinkLoading ? (
                        <Loader2 className="h-4 w-4 text-muted-foreground flex-shrink-0 animate-spin" />
                      ) : (
                        <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} flex-1 min-w-0`}>
                        {isExpanded && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground truncate block">{item.label}</span>
                            {isLinkLoading ? (
                              <Loader2 className="ml-2 h-3 w-3 text-muted-foreground animate-spin" />
                            ) : (
                              <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                                {typeof item.count === 'number' ? item.count : '—'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* Journal archive removed — calendar provides access to entries by date */}
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
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground truncate block">{item.label}</span>
                          {item.label === 'Shared with me' && (
                            <span className="ml-2 text-xs text-muted-foreground tabular-nums">{typeof sharedCount === 'number' ? sharedCount : '—'}</span>
                          )}
                        </div>
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