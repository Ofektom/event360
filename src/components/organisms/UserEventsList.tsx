'use client'

import Link from 'next/link'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'

interface Event {
  id: string
  title: string
  slug?: string
  description?: string | null
  startDate?: Date | string | null
  endDate?: Date | string | null
  location?: string | null
  status?: string
  _count?: {
    invitees?: number
    mediaAssets?: number
  }
}

interface UserEventsListProps {
  events: Event[]
  type: 'created' | 'invited'
}

export function UserEventsList({ events, type }: UserEventsListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="mb-4">
          {type === 'created'
            ? "You haven't created any events yet."
            : "You haven't been invited to any events yet."}
        </p>
        {type === 'created' && (
          <Link href="/events/new">
            <Button variant="primary" size="sm">
              Create Your First Event
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Link
          key={event.id}
          href={event.slug ? `/e/${event.slug}` : `/events/${event.id}`}
          className="block"
        >
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {event.title}
                </h3>
                {event.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {event.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  {event.startDate && (
                    <span>
                      📅 {new Date(event.startDate).toLocaleDateString()}
                    </span>
                  )}
                  {event.location && <span>📍 {event.location}</span>}
                  {event._count && (
                    <>
                      {event._count.invitees !== undefined && (
                        <span>👥 {event._count.invitees} guests</span>
                      )}
                      {event._count.mediaAssets !== undefined && (
                        <span>📸 {event._count.mediaAssets} photos</span>
                      )}
                    </>
                  )}
                </div>
              </div>
              {event.status && (
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    event.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-800'
                      : event.status === 'DRAFT'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {event.status}
                </span>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}

