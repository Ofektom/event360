'use client'

import { ReactNode, useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
  children: ReactNode
  eventId?: string | null // Optional eventId for event-specific sidebar links
}

export function DashboardLayout({ children, eventId: propEventId }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return false
  })
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return false
  })
  const [activeMenuType, setActiveMenuType] = useState<'events' | 'invitations' | 'order-of-events' | 'gallery' | 'reels'>('events')
  const pathname = usePathname()

  // Determine which pages should show sidebar
  const shouldShowSidebar = 
    pathname?.startsWith('/timeline') || 
    pathname?.startsWith('/dashboard/events') ||
    pathname?.startsWith('/events/') ||
    pathname?.startsWith('/invitations') ||
    pathname?.startsWith('/order-of-events') ||
    pathname?.startsWith('/gallery') ||
    pathname?.startsWith('/reels')

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      if (desktop) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Determine menu type based on pathname
  // Check for specific sections first (invitations, order-of-events, etc.) before checking events
  // This ensures that invitation pages keep the invitation sidebar even if they're under /events/[eventId]/invitations
  useEffect(() => {
    // Check for invitation routes first (including nested under /events/)
    if (
      pathname?.startsWith('/invitations') || 
      pathname?.includes('/invitations') || 
      pathname?.includes('/send-invitations')
    ) {
      setActiveMenuType('invitations')
    } 
    // Check for order-of-events/ceremonies routes
    else if (
      pathname?.startsWith('/order-of-events') || 
      pathname?.includes('/ceremonies')
    ) {
      setActiveMenuType('order-of-events')
    } 
    // Check for gallery routes
    else if (
      pathname?.startsWith('/gallery') || 
      pathname?.includes('/gallery')
    ) {
      setActiveMenuType('gallery')
    } 
    // Check for reels routes
    else if (
      pathname?.startsWith('/reels') || 
      pathname?.includes('/reels')
    ) {
      setActiveMenuType('reels')
    } 
    // Finally check for events routes (but not if they're invitation/ceremony/gallery/reels routes)
    else if (
      pathname?.startsWith('/timeline') || 
      pathname?.startsWith('/dashboard/events') || 
      pathname?.startsWith('/events/')
    ) {
      setActiveMenuType('events')
    }
  }, [pathname])

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)

  const handleTabClick = () => {
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Navbar - Fixed at top */}
      <Navbar 
        variant="dashboard" 
        onMenuClick={toggleSidebar}
        onActiveTabChange={(tab) => {
          // Don't override menu type if we're on a route that should have a specific menu type
          // The pathname-based useEffect will handle setting the correct menu type
          // This callback is mainly for when user clicks tabs in the navbar
          // But we still respect pathname-based routing for nested routes
          if (
            pathname?.includes('/invitations') || 
            pathname?.includes('/send-invitations') ||
            pathname?.includes('/ceremonies') ||
            pathname?.includes('/gallery') ||
            pathname?.includes('/reels')
          ) {
            // Let the pathname-based useEffect handle these routes
            return
          }
          setActiveMenuType(tab as typeof activeMenuType)
        }}
      />
      
      {/* Sidebar - Show on relevant pages */}
      {shouldShowSidebar && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={handleTabClick}
          menuType={activeMenuType}
          eventId={propEventId || pathname?.match(/\/events\/([^/]+)/)?.[1] || null}
        />
      )}

      {/* Main Content Area - Shift based on sidebar */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          shouldShowSidebar && sidebarOpen ? 'lg:ml-64' : ''
        }`}
        style={{ marginTop: isDesktop ? '5rem' : '7.5rem' }}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="w-full max-w-full px-[10px] pt-4 pb-4">
            {children}
          </div>
        </div>
        
        {/* Footer - Always at bottom, outside scrollable area */}
        <div className="flex-shrink-0">
          <Footer variant="dashboard" />
        </div>
      </div>
    </div>
  )
}
