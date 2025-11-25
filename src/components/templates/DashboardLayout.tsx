'use client'

import { ReactNode, useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Show sidebar on timeline, events pages, and event detail pages
  const showSidebar = 
    pathname?.startsWith('/timeline') || 
    pathname?.startsWith('/dashboard/events') ||
    pathname?.startsWith('/events/')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar variant="dashboard" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Only show on timeline/events pages */}
        {showSidebar && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <main
          className={`
            flex-1 overflow-y-auto transition-all duration-300
            ${showSidebar ? 'lg:ml-64' : ''}
          `}
        >
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>

      <Footer variant="dashboard" />
    </div>
  )
}
