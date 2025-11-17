'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

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
  const eventId = params.eventId as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) throw new Error('Failed to fetch event')
      const data = await response.json()
      setEvent(data)
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Event not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-purple-600 hover:text-purple-700 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{event.title}</h1>
          {event.description && (
            <p className="text-lg text-gray-600">{event.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-2xl font-bold text-purple-600">{event.ceremonies.length}</div>
            <div className="text-sm text-gray-600">Ceremonies</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-2xl font-bold text-pink-600">{event._count.invitees}</div>
            <div className="text-sm text-gray-600">Guests</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-2xl font-bold text-blue-600">{event._count.mediaAssets}</div>
            <div className="text-sm text-gray-600">Photos</div>
          </div>
        </div>

        {/* Ceremonies Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Ceremonies</h2>
            <Link
              href={`/events/${eventId}/ceremonies/new`}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
              + Add Ceremony
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
                  className="block p-6 border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-colors"
                >
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
                    <span className="text-purple-600">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href={`/events/${eventId}/invitees`}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-purple-300"
          >
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-semibold text-gray-900 mb-2">Manage Guests</h3>
            <p className="text-sm text-gray-600">Add invitees and track RSVPs</p>
          </Link>
          <Link
            href={`/events/${eventId}/gallery`}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-pink-300"
          >
            <div className="text-3xl mb-3">📸</div>
            <h3 className="font-semibold text-gray-900 mb-2">Photo Gallery</h3>
            <p className="text-sm text-gray-600">View and manage event photos</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

