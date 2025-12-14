'use client'

import { ReactNode, useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemeConfig } from '@/types/theme.types'
import { usePathname } from 'next/navigation'

interface PublicEventLayoutProps {
  children: ReactNode
  theme?: ThemeConfig
}

export function PublicEventLayout({ children, theme }: PublicEventLayoutProps) {
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
  const pathname = usePathname()

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

  // Extract eventId from pathname if available
  const extractedEventId = pathname?.match(/\/events\/([^/]+)/)?.[1] || null

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)

  const handleTabClick = () => {
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }

  // Determine if we should show sidebar (for public event pages, show events sidebar)
  const shouldShowSidebar = pathname?.startsWith('/e/')

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full" style={{ backgroundColor: theme?.colors.background || '#ffffff' }}>
        <Navbar variant="public" onMenuClick={toggleSidebar} />
        
        {/* Sidebar - Show for public event pages */}
        {shouldShowSidebar && (
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={handleTabClick}
            menuType="events"
            eventId={extractedEventId}
          />
        )}

        {/* Main Content Area - Adjust margin when sidebar is open */}
        <main 
          className={`flex-1 transition-all duration-300 overflow-x-hidden w-full max-w-full ${
            shouldShowSidebar && sidebarOpen && isDesktop ? 'lg:ml-64' : ''
          }`}
        >
          {children}
        </main>
        
        <Footer variant="public" />
      </div>
    </ThemeProvider>
  )
}

