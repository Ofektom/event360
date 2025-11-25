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
  const getActiveTab = () => {
    if (pathname?.startsWith('/timeline') || pathname?.startsWith('/dashboard/events') || pathname?.startsWith('/events/')) {
      return 'events'
    }
    if (pathname?.startsWith('/invitations')) {
      return 'invitations'
    }
    if (pathname?.startsWith('/order-of-events')) {
      return 'order-of-events'
    }
    if (pathname?.startsWith('/gallery')) {
      return 'gallery'
    }
    if (pathname?.startsWith('/reels')) {
      return 'reels'
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
          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/timeline"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/timeline') || isActive('/dashboard/events') || isActive('/events/')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Events
            </Link>
            <Link
              href="/invitations"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/invitations')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Invitations
            </Link>
            <Link
              href="/order-of-events"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/order-of-events')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Order of Event
            </Link>
            <Link
              href="/gallery"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/gallery')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Gallery
            </Link>
            <Link
              href="/reels"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/reels')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Reels
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
        <div className="lg:hidden pb-4 border-t border-gray-200 mt-2 pt-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/timeline"
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive('/timeline') || isActive('/dashboard/events') || isActive('/events/')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Events
            </Link>
            <Link
              href="/invitations"
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive('/invitations')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Invitations
            </Link>
            <Link
              href="/order-of-events"
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive('/order-of-events')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Order of Event
            </Link>
            <Link
              href="/gallery"
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive('/gallery')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Gallery
            </Link>
            <Link
              href="/reels"
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive('/reels')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Reels
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
