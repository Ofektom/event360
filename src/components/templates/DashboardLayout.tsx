'use client'

import { ReactNode, useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Initialize sidebar as open on desktop (>= 1024px)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
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

  // Pages that should be left-aligned (not centered) when sidebar is present
  const shouldBeLeftAligned = 
    pathname?.startsWith('/timeline') || 
    pathname?.startsWith('/invitations')

  // Handle window resize to auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024
      if (isDesktop) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    handleResize() // Initial check
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Determine menu type based on pathname
  useEffect(() => {
    if (pathname?.startsWith('/timeline') || pathname?.startsWith('/dashboard/events') || pathname?.startsWith('/events/')) {
      setActiveMenuType('events')
    } else if (pathname?.startsWith('/invitations')) {
      setActiveMenuType('invitations')
    } else if (pathname?.startsWith('/order-of-events')) {
      setActiveMenuType('order-of-events')
    } else if (pathname?.startsWith('/gallery')) {
      setActiveMenuType('gallery')
    } else if (pathname?.startsWith('/reels')) {
      setActiveMenuType('reels')
    }
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Navbar - Fixed at top */}
      <Navbar 
        variant="dashboard" 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onActiveTabChange={(tab) => {
          setActiveMenuType(tab as typeof activeMenuType)
        }}
      />
      
      {/* Sidebar - Show on relevant pages */}
      {shouldShowSidebar && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          menuType={activeMenuType}
        />
      )}

      {/* Main Content Area - Shift based on sidebar */}
      <main
        className={`
          flex-1 mt-16 overflow-y-auto transition-all duration-300
          ${shouldShowSidebar ? 'lg:ml-64' : ''}
        `}
      >
        <div className="px-[10px] py-4">
          {children}
        </div>
      </main>

      <Footer variant="dashboard" />
    </div>
  )
}
