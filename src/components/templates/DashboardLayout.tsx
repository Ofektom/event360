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
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar 
        variant="dashboard" 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onActiveTabChange={(tab) => {
          setActiveMenuType(tab as typeof activeMenuType)
        }}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Show on relevant pages */}
        {shouldShowSidebar && (
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            menuType={activeMenuType}
          />
        )}

        {/* Main Content */}
        <main
          className={`
            flex-1 overflow-y-auto transition-all duration-300
            ${shouldShowSidebar ? 'lg:ml-64' : ''}
            w-full
          `}
        >
          <div className={`w-full max-w-7xl ${shouldShowSidebar && shouldBeLeftAligned ? '' : 'mx-auto'} p-[10px]`}>
            {children}
          </div>
        </main>
      </div>

      <Footer variant="dashboard" />
    </div>
  )
}
