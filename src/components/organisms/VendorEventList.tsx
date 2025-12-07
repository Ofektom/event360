'use client'

import { Card } from '@/components/atoms/Card'
import Link from 'next/link'

interface VendorEventListProps {
  events: any[]
}

export function VendorEventList({ events }: VendorEventListProps) {
  const upcomingEvents = events.filter(
    (ev) => ev.event.startDate && new Date(ev.event.startDate) > new Date()
  )
  const pastEvents = events.filter(
    (ev) => !ev.event.startDate || new Date(ev.event.startDate) <= new Date()
  )

  const renderEventCard = (eventVendor: any) => {
    const event = eventVendor.event
    const eventDate = event.startDate ? new Date(event.startDate) : null
    const endDate = event.endDate ? new Date(event.endDate) : null

    return (
      <Card key={eventVendor.id} variant="elevated" padding="md" className="mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                event.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                event.status === 'LIVE' ? 'bg-red-100 text-red-700' :
                event.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {event.status}
              </span>
            </div>

            {event.description && (
              <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
            )}

            <div className="space-y-2 text-sm text-gray-600">
              {eventDate && (
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>
                    {eventDate.toLocaleDateString()}
                    {endDate && endDate.getTime() !== eventDate.getTime() && (
                      <> - {endDate.toLocaleDateString()}</>
                    )}
                  </span>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{event.location}</span>
                </div>
              )}

              {event.owner && (
                <div className="flex items-center gap-2">
                  <span>👤</span>
                  <span>
                    Event Owner: {event.owner.name || event.owner.email}
                    {event.owner.phone && ` (${event.owner.phone})`}
                  </span>
                </div>
              )}

              {eventVendor.role && (
                <div className="flex items-center gap-2">
                  <span>🎭</span>
                  <span>Role: {eventVendor.role}</span>
                </div>
              )}

              {eventVendor.notes && (
                <div className="flex items-start gap-2 mt-2">
                  <span>📝</span>
                  <span className="text-gray-700">{eventVendor.notes}</span>
                </div>
              )}
            </div>
          </div>

          <Link
            href={`/vendor/events/${event.id}`}
            className="ml-4 text-purple-600 hover:underline text-sm font-medium whitespace-nowrap"
          >
            View Details →
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
          {upcomingEvents.map(renderEventCard)}
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Past Events</h2>
          {pastEvents.map(renderEventCard)}
        </div>
      )}

      {/* No Events */}
      {events.length === 0 && (
        <Card variant="elevated" padding="md">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No events assigned yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Event creators will be able to add you to their events
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

