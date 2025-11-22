'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'

interface Event {
  id: string
  title: string
  slug?: string | null
  description?: string | null
  type: string
  status: string
  startDate?: Date | string | null
  endDate?: Date | string | null
  location?: string | null
  _count?: {
    invitees?: number
    mediaAssets?: number
    interactions?: number
  }
}

interface EventsListProps {
  events: Event[]
}

export function EventsList({ events: initialEvents }: EventsListProps) {
  const router = useRouter()
  const [events, setEvents] = useState(initialEvents)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || event.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(eventId)

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      // Remove from list
      setEvents(events.filter((e) => e.id !== eventId))
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update event status')
      }

      // Update local state
      setEvents(
        events.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e))
      )
    } catch (error) {
      console.error('Error updating event status:', error)
      alert('Failed to update event status. Please try again.')
    }
  }

  if (events.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No events yet</h2>
        <p className="text-gray-600 mb-6">
          Get started by creating your first event
        </p>
        <Link href="/events/new">
          <Button variant="primary">Create Your First Event</Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search events by title, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No events match your filters.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <Link href={event.slug ? `/e/${event.slug}` : `/events/${event.id}`}>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-[var(--theme-primary)] transition-colors">
                      {event.title}
                    </h3>
                  </Link>
                  {event.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {event.description}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                    event.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-800'
                      : event.status === 'DRAFT'
                      ? 'bg-gray-100 text-gray-800'
                      : event.status === 'CANCELLED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {event.status}
                </span>
              </div>

              {/* Event Details */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                {event.startDate && (
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{new Date(event.startDate).toLocaleDateString()}</span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
                {event._count && (
                  <div className="flex items-center gap-4 pt-2">
                    {event._count.invitees !== undefined && (
                      <span>👥 {event._count.invitees}</span>
                    )}
                    {event._count.mediaAssets !== undefined && (
                      <span>📸 {event._count.mediaAssets}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <Link href={`/events/${event.id}`} className="flex-1 min-w-[100px]">
                  <Button variant="outline" size="sm" className="w-full">
                    View
                  </Button>
                </Link>
                <Link href={`/events/${event.id}/edit`} className="flex-1 min-w-[100px]">
                  <Button variant="outline" size="sm" className="w-full">
                    Edit
                  </Button>
                </Link>
                {event.status === 'DRAFT' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(event.id, 'PUBLISHED')}
                    className="flex-1 min-w-[100px]"
                  >
                    Publish
                  </Button>
                ) : event.status === 'PUBLISHED' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(event.id, 'DRAFT')}
                    className="flex-1 min-w-[100px]"
                  >
                    Unpublish
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(event.id, event.title)}
                  isLoading={deletingId === event.id}
                  disabled={deletingId === event.id}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

