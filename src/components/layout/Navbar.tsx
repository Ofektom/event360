'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/atoms/Button'

interface NavbarProps {
  variant?: 'dashboard' | 'public'
  onMenuClick?: () => void
  onActiveTabChange?: (tab: string) => void
}

export function Navbar({ variant = 'dashboard', onMenuClick, onActiveTabChange }: NavbarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  // Determine active tab based on pathname
  // Check for specific sections first (invitations, order-of-events, etc.) before checking events
  // This ensures that invitation pages show the invitation tab even if they're under /events/[eventId]/invitations
  const getActiveTab = () => {
    // Check for invitation routes first (including nested under /events/)
    if (
      pathname?.startsWith('/invitations') || 
      pathname?.includes('/invitations') || 
      pathname?.includes('/send-invitations')
    ) {
      return 'invitations'
    }
    // Check for order-of-events/ceremonies routes
    if (
      pathname?.startsWith('/order-of-events') || 
      pathname?.includes('/ceremonies')
    ) {
      return 'order-of-events'
    }
    // Check for gallery routes
    if (
      pathname?.startsWith('/gallery') || 
      pathname?.includes('/gallery')
    ) {
      return 'gallery'
    }
    // Check for reels routes
    if (
      pathname?.startsWith('/reels') || 
      pathname?.includes('/reels')
    ) {
      return 'reels'
    }
    // Finally check for events routes (but not if they're invitation/ceremony/gallery/reels routes)
    if (
      pathname?.startsWith('/timeline') || 
      pathname?.startsWith('/dashboard/events') || 
      pathname?.startsWith('/events/')
    ) {
      return 'events'
    }
    return 'events' // Default
  }

  // Notify parent of active tab change
  useEffect(() => {
    if (onActiveTabChange) {
      onActiveTabChange(getActiveTab())
    }
  }, [pathname, onActiveTabChange])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  if (variant === 'public') {
    return (
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-2xl font-bold text-[var(--theme-primary)]">
              Event360
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="#programme"
                className="text-gray-700 hover:text-[var(--theme-primary)] transition-colors"
              >
                Programme
              </Link>
              <Link
                href="#gallery"
                className="text-gray-700 hover:text-[var(--theme-primary)] transition-colors"
              >
                Gallery
              </Link>
              <Link
                href="#vendors"
                className="text-gray-700 hover:text-[var(--theme-primary)] transition-colors"
              >
                Vendors
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Dashboard navbar
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-lg border-b border-gray-200 z-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Left: Logo and Hamburger */}
          <div className="flex items-center gap-4">
            {/* Hamburger Menu (Mobile) */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link href="/timeline" className="text-2xl font-bold text-purple-600">
              Event360
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/timeline"
              className={`px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center ${
                isActive('/timeline') || isActive('/dashboard/events') || isActive('/events/')
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title="Events"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <Link
              href="/invitations"
              className={`px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center ${
                isActive('/invitations')
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title="Invitations"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Link>
            <Link
              href="/order-of-events"
              className={`px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center ${
                isActive('/order-of-events')
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title="Order of Event"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </Link>
            <Link
              href="/gallery"
              className={`px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center ${
                isActive('/gallery')
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title="Photos"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </Link>
            <Link
              href="/reels"
              className={`px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center ${
                isActive('/reels')
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title="Reels"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </Link>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-4">
            {session ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                    {session.user?.name?.charAt(0).toUpperCase() ||
                      session.user?.email?.charAt(0).toUpperCase() ||
                      'U'}
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${
                      showUserMenu ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>👤</span>
                        <span>Profile</span>
                      </div>
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>⚙️</span>
                        <span>Settings</span>
                      </div>
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        handleSignOut()
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>🚪</span>
                        <span>Sign Out</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Links */}
        <div className="lg:hidden pb-3 border-t border-gray-200 mt-2 pt-3">
          <div className="flex items-center justify-between gap-2 px-2">
            <Link
              href="/timeline"
              className={`p-2.5 rounded-lg transition-all duration-200 flex-shrink-0 flex-1 flex items-center justify-center ${
                isActive('/timeline') || isActive('/dashboard/events') || isActive('/events/')
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Events"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <Link
              href="/invitations"
              className={`p-2.5 rounded-lg transition-all duration-200 flex-shrink-0 flex-1 flex items-center justify-center ${
                isActive('/invitations')
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Invitations"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Link>
            <Link
              href="/order-of-events"
              className={`p-2.5 rounded-lg transition-all duration-200 flex-shrink-0 flex-1 flex items-center justify-center ${
                isActive('/order-of-events')
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Order of Event"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </Link>
            <Link
              href="/gallery"
              className={`p-2.5 rounded-lg transition-all duration-200 flex-shrink-0 flex-1 flex items-center justify-center ${
                isActive('/gallery')
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Photos"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </Link>
            <Link
              href="/reels"
              className={`p-2.5 rounded-lg transition-all duration-200 flex-shrink-0 flex-1 flex items-center justify-center ${
                isActive('/reels')
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Reels"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
