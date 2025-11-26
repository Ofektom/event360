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
          setActiveMenuType(tab as typeof activeMenuType)
        }}
      />
      
      {/* Sidebar - Show on relevant pages */}
      {shouldShowSidebar && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={handleTabClick}
          menuType={activeMenuType}
        />
      )}

      {/* Main Content Area - Shift based on sidebar */}
      <div
        className={`flex-1 flex flex-col mt-16 transition-all duration-300 ${
          shouldShowSidebar && sidebarOpen ? 'lg:ml-64' : ''
        }`}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="w-full max-w-full px-[10px] py-4">
            {children}
          </div>
        </div>
        
        {/* Footer - Always at bottom */}
        <Footer variant="dashboard" />
      </div>
    </div>
  )
}
