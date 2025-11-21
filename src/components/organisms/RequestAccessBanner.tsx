'use client'

import { useState } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { useRouter } from 'next/navigation'

interface RequestAccessBannerProps {
  eventId: string
}

export function RequestAccessBanner({ eventId }: RequestAccessBannerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleRequestAccess = async () => {
    setLoading(true)
    setMessage('')

    try {
      // Try to auto-link user to invitee
      const response = await fetch('/api/invitees/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Access granted! Refreshing...')
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        setMessage(data.error || 'Unable to grant access. Please contact the event organizer.')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4">
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Request Access
            </h3>
            <p className="text-gray-600">
              You're signed in, but you need to be linked to this event to interact. Click below to request access.
            </p>
            {message && (
              <p className={`mt-2 text-sm ${message.includes('granted') ? 'text-green-600' : 'text-red-600'}`}>
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
            Request Access
          </Button>
        </div>
      </Card>
    </div>
  )
}

