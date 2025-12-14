'use client'

import { ReactNode, useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

interface VendorDashboardLayoutProps {
  children: ReactNode
}

const vendorMenuItems = [
  {
    label: 'Dashboard',
    href: '/vendor/dashboard',
    icon: '📊',
  },
  {
    label: 'My Events',
    href: '/vendor/events',
    icon: '📅',
  },
  {
    label: 'Profile',
    href: '/vendor/profile',
    icon: '👤',
  },
  {
    label: 'Settings',
    href: '/vendor/settings',
    icon: '⚙️',
  },
]

export function VendorDashboardLayout({ children }: VendorDashboardLayoutProps) {
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

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-full">
      {/* Navbar - Fixed at top */}
      <Navbar variant="dashboard" onMenuClick={toggleSidebar} />
      
      {/* Sidebar - Vendor-specific menu */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 overflow-y-auto overflow-x-hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDesktop ? 'translate-x-0' : ''}`}
        style={{ marginTop: isDesktop ? '5rem' : '7.5rem', height: isDesktop ? 'calc(100vh - 5rem)' : 'calc(100vh - 7.5rem)' }}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Vendor Portal</h2>
            <p className="text-xs text-gray-500 mt-1">Manage your business</p>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {vendorMenuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (!isDesktop) {
                        setSidebarOpen(false)
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-purple-50 text-purple-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
          style={{ marginTop: '7.5rem' }}
        />
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 overflow-x-hidden w-full max-w-full ${
          sidebarOpen ? 'lg:ml-64' : ''
        }`}
        style={{ marginTop: isDesktop ? '5rem' : '7.5rem' }}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full max-w-full">
          <div className="w-full max-w-full px-[10px] sm:px-4 pt-4 pb-4">
            {children}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 w-full max-w-full">
          <Footer variant="dashboard" />
        </div>
      </div>
    </div>
  )
}

