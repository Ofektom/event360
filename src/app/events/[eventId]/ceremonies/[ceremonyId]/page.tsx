'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { OrderOfEventsList } from '@/components/organisms/OrderOfEventsList'
import { EventVendorsList } from '@/components/organisms/EventVendorsList'
import { ScheduleItemModal } from '@/components/organisms/ScheduleItemModal'
import { BackButton } from '@/components/shared/BackButton'

interface Ceremony {
  id: string
  name: string
  description: string | null
  date: string
  startTime: string | null
  endTime: string | null
  location: string | null
  venue: string | null
  dressCode: string | null
  notes: string | null
  streamUrl: string | null
  isStreaming: boolean
  order: number
}

interface Event {
  id: string
  title: string
  ownerId: string
}

export default function CeremonyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const eventId = params.eventId as string
  const ceremonyId = params.ceremonyId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [ceremony, setCeremony] = useState<Ceremony | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/events/${eventId}/ceremonies/${ceremonyId}`)
      return
    }
    if (status === 'authenticated') {
      fetchData()
    }
  }, [eventId, ceremonyId, status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [eventRes, ceremoniesRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/ceremonies`),
      ])

      if (!eventRes.ok) {
        if (eventRes.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error('Failed to fetch event')
      }

      if (!ceremoniesRes.ok) {
        throw new Error('Failed to fetch ceremonies')
      }

      const eventData = await eventRes.json()
      const ceremoniesData = await ceremoniesRes.json()

      setEvent(eventData)
      
      const foundCeremony = ceremoniesData.find((c: Ceremony) => c.id === ceremonyId)
      if (!foundCeremony) {
        setError('Ceremony not found')
        return
      }

      setCeremony(foundCeremony)
      
      // Check if current user is the owner
      const isCurrentUserOwner = !!(session?.user?.id && eventData.ownerId === session.user.id)
      setIsOwner(isCurrentUserOwner)
    } catch (err: any) {
      console.error('Error fetching ceremony data:', err)
      setError(err.message || 'Failed to load ceremony details')
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

  if (error || !ceremony || !event) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <ErrorMessage message={error || 'Ceremony not found'} />
          <Link href={`/events/${eventId}`}>
            <Button variant="secondary" className="mt-4">
              ← Back to Event
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton href={`/events/${eventId}`} label={`Back to ${event.title}`} />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{ceremony.name}</h1>
            {ceremony.description && (
              <p className="text-gray-600 mt-2">{ceremony.description}</p>
            )}
          </div>
          {isOwner && (
            <Link href={`/events/${eventId}/ceremonies/${ceremonyId}/edit`}>
              <Button variant="primary">Edit Ceremony</Button>
            </Link>
          )}
        </div>

        {/* Ceremony Details */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ceremony Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ceremony.date && (
              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="font-medium text-gray-900">
                  {new Date(ceremony.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            )}
            {ceremony.startTime && (
              <div>
                <div className="text-sm text-gray-500">Start Time</div>
                <div className="font-medium text-gray-900">
                  {new Date(ceremony.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            )}
            {ceremony.endTime && (
              <div>
                <div className="text-sm text-gray-500">End Time</div>
                <div className="font-medium text-gray-900">
                  {new Date(ceremony.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            )}
            {ceremony.location && (
              <div>
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-medium text-gray-900">{ceremony.location}</div>
              </div>
            )}
            {ceremony.venue && (
              <div>
                <div className="text-sm text-gray-500">Venue</div>
                <div className="font-medium text-gray-900">{ceremony.venue}</div>
              </div>
            )}
            {ceremony.dressCode && (
              <div>
                <div className="text-sm text-gray-500">Dress Code</div>
                <div className="font-medium text-gray-900">{ceremony.dressCode}</div>
              </div>
            )}
            {ceremony.isStreaming && ceremony.streamUrl && (
              <div>
                <div className="text-sm text-gray-500">Live Stream</div>
                <Link
                  href={`/events/${eventId}/live`}
                  className="text-red-600 font-medium hover:underline"
                >
                  🔴 Watch Live Stream
                </Link>
              </div>
            )}
          </div>
          {ceremony.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">Notes</div>
              <div className="text-gray-900 mt-1">{ceremony.notes}</div>
            </div>
          )}
        </Card>

        {/* Order of Events */}
        <OrderOfEventsList
          ceremonyId={ceremonyId}
          ceremonyName={ceremony.name}
          isOwner={isOwner}
          refreshTrigger={refreshTrigger}
          onCreateNew={() => {
            setEditingItemId(null)
            setShowScheduleModal(true)
          }}
          onEdit={(itemId) => {
            setEditingItemId(itemId)
            setShowScheduleModal(true)
          }}
        />

        {/* Schedule Item Modal */}
        {showScheduleModal && (
          <ScheduleItemModal
            ceremonyId={ceremonyId}
            itemId={editingItemId || undefined}
            onClose={() => {
              setShowScheduleModal(false)
              setEditingItemId(null)
            }}
            onSuccess={() => {
              // Trigger refresh of the order of events list
              setRefreshTrigger((prev) => prev + 1)
            }}
          />
        )}

        {/* Vendors */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Vendors for {ceremony.name}
          </h2>
          <EventVendorsList
            eventId={eventId}
            ceremonyId={ceremonyId}
            isOwner={isOwner}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

