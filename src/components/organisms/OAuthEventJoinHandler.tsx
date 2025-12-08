'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Client component that handles joining an event after OAuth signin/signup
 * This runs after OAuth redirects to check for eventId in URL and join the event
 */
export function OAuthEventJoinHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')

  useEffect(() => {
    const joinEvent = async () => {
      if (!eventId) return

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
          router.replace(currentUrl.pathname + currentUrl.search)
          router.refresh()
        }
      } catch (error) {
        console.error('Error joining event after OAuth:', error)
        // Continue anyway - user can manually join
      }
    }

    joinEvent()
  }, [eventId, router])

  return null
}

