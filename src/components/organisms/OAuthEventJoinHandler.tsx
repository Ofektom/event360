'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Client component that handles joining an event after OAuth signin/signup
 * This runs after OAuth redirects to check for eventId in URL and join the event
 * Includes mobile-specific handling for OAuth redirects
 */
export function OAuthEventJoinHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Only process once
    if (isProcessing) return
    
    const joinEvent = async () => {
      if (!eventId) {
        // If no eventId, ensure we're not stuck in a redirect loop
        // Check if we're on a callback page and should redirect
        const currentPath = window.location.pathname
        if (currentPath.includes('/api/auth/callback') || currentPath.includes('/auth/')) {
          // Let NextAuth handle the redirect naturally
          return
        }
        return
      }

      setIsProcessing(true)

      try {
        const response = await fetch(`/api/events/${eventId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          // Remove eventId from URL and refresh
          const currentUrl = new URL(window.location.href)
          currentUrl.searchParams.delete('eventId')
          
          // Use replace to avoid adding to history
          // For mobile, use window.location for more reliable redirect
          if (window.location.pathname.includes('/api/auth/callback')) {
            // If we're still on callback page, wait a bit then redirect
            setTimeout(() => {
              router.replace(currentUrl.pathname + currentUrl.search)
              router.refresh()
            }, 100)
          } else {
            router.replace(currentUrl.pathname + currentUrl.search)
            router.refresh()
          }
        } else {
          // Even if join fails, clean up the URL
          const currentUrl = new URL(window.location.href)
          currentUrl.searchParams.delete('eventId')
          router.replace(currentUrl.pathname + currentUrl.search)
        }
      } catch (error) {
        console.error('Error joining event after OAuth:', error)
        // Clean up URL even on error
        try {
          const currentUrl = new URL(window.location.href)
          currentUrl.searchParams.delete('eventId')
          router.replace(currentUrl.pathname + currentUrl.search)
        } catch (e) {
          // Ignore URL cleanup errors
        }
      } finally {
        setIsProcessing(false)
      }
    }

    // Add a small delay for mobile browsers to ensure OAuth callback is complete
    const timer = setTimeout(() => {
      joinEvent()
    }, 300)

    return () => clearTimeout(timer)
  }, [eventId, router, isProcessing])

  return null
}

