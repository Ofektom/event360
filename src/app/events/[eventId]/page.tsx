'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { EventHeader } from '@/components/organisms/EventHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

interface Event {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  startDate: string | null
  endDate: string | null
  location: string | null
  ceremonies: Ceremony[]
  _count: {
    invitees: number
    mediaAssets: number
    interactions: number
  }
}

interface Ceremony {
  id: string
  name: string
  description: string | null
  order: number
  date: string
  location: string | null
  venue: string | null
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const eventId = params.eventId as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/events/${eventId}`)
      return
    }
    if (status === 'authenticated') {
      fetchEvent()
    }
  }, [eventId, status, router])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error('Failed to fetch event')
      }
      const data = await response.json()
      setEvent(data)
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
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

  if (!event) {
    return (
      <DashboardLayout>
        <ErrorMessage message="Event not found" />
      </DashboardLayout>
    )
  }


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            ← Back to Dashboard
          </Button>
        </Link>

        {/* Event Header */}
        <EventHeader
          title={event.title}
          description={event.description || undefined}
          startDate={event.startDate ? new Date(event.startDate) : undefined}
          endDate={event.endDate ? new Date(event.endDate) : undefined}
          location={event.location || undefined}
        />

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="text-2xl font-bold text-[var(--theme-primary)]">
              {event.ceremonies.length}
            </div>
            <div className="text-sm text-gray-600">Ceremonies</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-pink-600">
              {event._count.invitees}
            </div>
            <div className="text-sm text-gray-600">Guests</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-blue-600">
              {event._count.mediaAssets}
            </div>
            <div className="text-sm text-gray-600">Photos</div>
          </Card>
        </div>

        {/* Ceremonies Section */}
        <Card className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Ceremonies</h2>
            <Link href={`/events/${eventId}/ceremonies/new`}>
              <Button variant="primary">
                + Add Ceremony
              </Button>
            </Link>
          </div>

          {event.ceremonies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">💒</div>
              <p>No ceremonies yet. Add your first ceremony to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {event.ceremonies.map((ceremony) => (
                <Link
                  key={ceremony.id}
                  href={`/events/${eventId}/ceremonies/${ceremony.id}`}
                >
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {ceremony.name}
                        </h3>
                        {ceremony.description && (
                          <p className="text-gray-600 mb-2">{ceremony.description}</p>
                        )}
                        <div className="flex gap-4 text-sm text-gray-500">
                          {ceremony.date && (
                            <span>
                              📅 {new Date(ceremony.date).toLocaleDateString()}
                            </span>
                          )}
                          {ceremony.location && (
                            <span>📍 {ceremony.location}</span>
                          )}
                          {ceremony.venue && (
                            <span>🏛️ {ceremony.venue}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[var(--theme-primary)]">→</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link href={`/events/${eventId}/invitees`}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-semibold text-gray-900 mb-2">Manage Guests</h3>
              <p className="text-sm text-gray-600">Add invitees and track RSVPs</p>
            </Card>
          </Link>
          <Link href={`/events/${eventId}/gallery`}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-3xl mb-3">📸</div>
              <h3 className="font-semibold text-gray-900 mb-2">Photo Gallery</h3>
              <p className="text-sm text-gray-600">View and manage event photos</p>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}

