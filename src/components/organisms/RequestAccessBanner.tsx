'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { useRouter } from 'next/navigation'

interface RequestAccessBannerProps {
  eventId: string
  eventSlug?: string
}

export function RequestAccessBanner({ eventId, eventSlug }: RequestAccessBannerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [autoJoining, setAutoJoining] = useState(true)

  // Automatically join event when component mounts
  useEffect(() => {
    const autoJoin = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (response.ok) {
          // Successfully joined, refresh page
          router.refresh()
        } else {
          // If auto-join fails, show manual button
          setAutoJoining(false)
        }
      } catch (error) {
        // If error, show manual button
        setAutoJoining(false)
      }
    }

    autoJoin()
  }, [eventId, router])

  const handleRequestAccess = async () => {
    setLoading(true)
    setMessage('')

    try {
      // Try to join event (creates invitee or links existing)
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Successfully joined! Refreshing...')
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        setMessage(data.error || 'Unable to join event. Please contact the event organizer.')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (autoJoining) {
    return (
      <div className="container mx-auto px-4">
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-gray-700">Joining event...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Join Event
            </h3>
            <p className="text-gray-600">
              Join this event to view the timeline, photo gallery, and interact with other guests.
            </p>
            {message && (
              <p className={`mt-2 text-sm ${message.includes('Successfully') || message.includes('granted') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleRequestAccess}
            isLoading={loading}
            disabled={loading}
          >
            Join Event
          </Button>
        </div>
      </Card>
    </div>
  )
}

