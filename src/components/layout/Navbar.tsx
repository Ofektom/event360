'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/atoms/Button'

interface NavbarProps {
  variant?: 'dashboard' | 'public'
}

export function Navbar({ variant = 'dashboard' }: NavbarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

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
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/timeline" className="text-2xl font-bold text-purple-600">
            Event360
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/timeline"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/timeline')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Events
            </Link>
            <Link
              href="/dashboard/events"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard/events')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Manage Events
            </Link>
            <Link
              href="/dashboard/guests"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard/guests')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Guests
            </Link>
            <Link
              href="/dashboard/media"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard/media')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Media
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            {session ? (
              <>
                <div className="flex items-center gap-3">
                  <Link href="/profile">
                    <span className="text-sm text-gray-700 hover:text-[var(--theme-primary)] cursor-pointer">
                      {session.user?.name || session.user?.email}
                    </span>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              </>
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
      </div>
    </nav>
  )
}

