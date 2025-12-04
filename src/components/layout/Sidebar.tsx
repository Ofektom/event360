'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/atoms/Button'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  menuType?: 'events' | 'invitations' | 'order-of-events' | 'gallery' | 'reels'
  eventId?: string | null // Optional eventId for event-specific links
}

interface MenuItem {
  label: string
  href: string
  icon: string
}

const menuConfigs: Record<string, MenuItem[]> = {
  events: [
    {
      label: 'Manage Events',
      href: '/dashboard/events',
      icon: '📋',
    },
    {
      label: 'Create Event',
      href: '/events/new',
      icon: '➕',
    },
    {
      label: 'Event Settings',
      href: '/dashboard/settings',
      icon: '⚙️',
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: '📊',
    },
  ],
  invitations: [
    {
      label: 'My Invitations',
      href: '/invitations',
      icon: '💌',
    },
    {
      label: 'Design Invitation',
      href: '/invitations/design',
      icon: '🎨',
    },
    {
      label: 'Upload Custom Design',
      href: '/invitations/upload',
      icon: '📤',
    },
    {
      label: 'Share Invitation',
      href: '/invitations/share',
      icon: '🔗',
    },
    {
      label: 'Invitation Templates',
      href: '/invitations/templates',
      icon: '📄',
    },
  ],
  'order-of-events': [
    {
      label: 'All Programmes',
      href: '/order-of-events',
      icon: '📅',
    },
    {
      label: 'Create Programme',
      href: '/order-of-events/new',
      icon: '➕',
    },
    {
      label: 'Schedule Builder',
      href: '/order-of-events/builder',
      icon: '🔨',
    },
    {
      label: 'Programme Templates',
      href: '/order-of-events/templates',
      icon: '📋',
    },
  ],
  gallery: [
    {
      label: 'All Photos',
      href: '/gallery',
      icon: '📸',
    },
    {
      label: 'Upload Photos',
      href: '/gallery/upload',
      icon: '📤',
    },
    {
      label: 'Featured Photos',
      href: '/gallery/featured',
      icon: '⭐',
    },
    {
      label: 'Photo Albums',
      href: '/gallery/albums',
      icon: '📁',
    },
    {
      label: 'Gallery Settings',
      href: '/gallery/settings',
      icon: '⚙️',
    },
  ],
  reels: [
    {
      label: 'All Reels',
      href: '/reels',
      icon: '🎬',
    },
    {
      label: 'Create Reel',
      href: '/reels/new',
      icon: '➕',
    },
    {
      label: 'Upload Video',
      href: '/reels/upload',
      icon: '📤',
    },
    {
      label: 'My Reels',
      href: '/reels/my-reels',
      icon: '🎥',
    },
    {
      label: 'Reel Templates',
      href: '/reels/templates',
      icon: '📄',
    },
  ],
}

export function Sidebar({ isOpen, onClose, menuType = 'events', eventId }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  // Extract eventId from pathname if not provided (for /events/[eventId]/... routes)
  const extractedEventId = eventId || (pathname?.match(/\/events\/([^/]+)/)?.[1] || null)

  // Get base menu items
  let menuItems = menuConfigs[menuType] || menuConfigs.events

  // For invitations menu, "Design Invitation" and "Share Invitation" always go to event selection pages
  // They will then redirect to the appropriate event-specific page after event selection
  if (menuType === 'invitations') {
    menuItems = menuItems.map((item) => {
      // "Design Invitation" goes to event selection page, which then shows templates for selected event
      if (item.label === 'Design Invitation') {
        return {
          ...item,
          href: '/invitations/design',
        }
      }
      // "Share Invitation" goes to event selection page, which then redirects to send-invitations for selected event
      if (item.label === 'Share Invitation') {
        return {
          ...item,
          href: '/invitations/share',
        }
      }
      // Keep other items as-is
      return item
    })
  }

  // Get the title based on menu type
  const getTitle = () => {
    switch (menuType) {
      case 'events':
        return 'Event Management'
      case 'invitations':
        return 'Invitation Management'
      case 'order-of-events':
        return 'Programme Management'
      case 'gallery':
        return 'Gallery Management'
      case 'reels':
        return 'Reels Management'
      default:
        return 'Event Management'
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:shadow-none lg:border-r lg:border-gray-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{getTitle()}</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Sidebar Menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    isActive(item.href)
                      ? 'bg-purple-100 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Event360 v1.0
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
