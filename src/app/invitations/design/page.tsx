'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

interface Event {
  id: string
  title: string
  type: string
  startDate: string | null
  location: string | null
  description: string | null
}

export default function DesignInvitationPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/invitations/design')
      return
    }
    if (status === 'authenticated') {
      fetchEvents()
    }
  }, [status, router])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/events')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error('Failed to fetch events')
      }
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleEventSelect = (eventId: string) => {
    // Redirect to the event-specific invitations page
    router.push(`/events/${eventId}/invitations`)
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link href="/invitations">
              <Button variant="ghost" size="sm" className="mb-4">
                ← Back to My Invitations
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Design Invitation</h1>
            <p className="text-gray-600 mt-2">
              Select an event to create or design an invitation
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <ErrorMessage message={error} />
        )}

        {/* Events List */}
        {events.length === 0 ? (
          <Card className="p-6">
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-lg font-medium mb-2">No events found</p>
              <p className="text-sm mb-4">
                Create an event first to design invitations.
              </p>
              <Link href="/events/new">
                <Button variant="primary">Create Event</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card
                key={event.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleEventSelect(event.id)}
              >
                <div className="flex flex-col h-full">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  {event.startDate && (
                    <p className="text-sm text-gray-600 mb-1">
                      📅 {new Date(event.startDate).toLocaleDateString()}
                    </p>
                  )}
                  {event.location && (
                    <p className="text-sm text-gray-600 mb-2">
                      📍 {event.location}
                    </p>
                  )}
                  {event.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="mt-auto pt-4">
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEventSelect(event.id)
                      }}
                    >
                      Design Invitation
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

