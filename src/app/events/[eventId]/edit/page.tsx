'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
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
  timezone: string
  visibility: string
  allowGuestUploads: boolean
  allowComments: boolean
  allowReactions: boolean
}

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const eventId = params.eventId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [event, setEvent] = useState<Event | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'WEDDING',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
    location: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    visibility: 'PUBLIC' as 'PUBLIC' | 'CONNECTED' | 'INVITED_ONLY',
    allowGuestUploads: false,
    allowComments: true,
    allowReactions: true,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/events/${eventId}/edit`)
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

      // Format dates for datetime-local input
      const startDate = data.startDate
        ? new Date(data.startDate).toISOString().slice(0, 16)
        : ''
      const endDate = data.endDate
        ? new Date(data.endDate).toISOString().slice(0, 16)
        : ''

      setEvent(data)
      setFormData({
        title: data.title || '',
        description: data.description || '',
        type: data.type || 'WEDDING',
        status: data.status || 'DRAFT',
        startDate,
        endDate,
        location: data.location || '',
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        visibility: data.visibility || 'PUBLIC',
        allowGuestUploads: data.allowGuestUploads || false,
        allowComments: data.allowComments !== undefined ? data.allowComments : true,
        allowReactions: data.allowReactions !== undefined ? data.allowReactions : true,
      })
    } catch (error) {
      console.error('Error fetching event:', error)
      setError('Failed to load event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (!session?.user) {
      setError('You must be signed in to edit an event')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Auto-sync isPublic based on visibility: PUBLIC = isPublic true
          isPublic: formData.visibility === 'PUBLIC',
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update event')
      }

      const updatedEvent = await response.json()
      router.push(`/events/${updatedEvent.id}`)
    } catch (error) {
      console.error('Error updating event:', error)
      setError(error instanceof Error ? error.message : 'Failed to update event. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
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
        <ErrorMessage message={error || 'Event not found'} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Event</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Title */}
            <Input
              label="Event Title"
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Our Wedding Celebration"
            />

            {/* Event Type */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Event Type *
              </label>
              <select
                id="type"
                name="type"
                required
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
              >
                <option value="WEDDING">Wedding</option>
                <option value="CELEBRATION">Celebration</option>
                <option value="BIRTHDAY">Birthday</option>
                <option value="CORPORATE">Corporate</option>
                <option value="CONFERENCE">Conference</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Status *
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="LIVE">Live</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell us about your event..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
              />
            </div>

            {/* Date Range */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
              <Input
                label="End Date"
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>

            {/* Location */}
            <Input
              label="Location"
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Lagos, Nigeria"
            />

            {/* Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Settings
              </h3>

              <div className="space-y-3">
                {/* Visibility Setting */}
                <div>
                  <label
                    htmlFor="visibility"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Who can view this event?
                  </label>
                  <select
                    id="visibility"
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                  >
                    <option value="PUBLIC">Anyone on the application</option>
                    <option value="CONNECTED">Anyone connected to me on the app</option>
                    <option value="INVITED_ONLY">Only invited guests on the app</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Selecting "Anyone on the application" makes your event accessible via public link and visible in timelines. Other options restrict access accordingly.
                  </p>
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="allowGuestUploads"
                    checked={formData.allowGuestUploads}
                    onChange={handleChange}
                    className="w-4 h-4 text-[var(--theme-primary)] border-gray-300 rounded focus:ring-[var(--theme-primary)]"
                  />
                  <span className="text-sm text-gray-700">
                    Allow guests to upload photos/videos
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="allowComments"
                    checked={formData.allowComments}
                    onChange={handleChange}
                    className="w-4 h-4 text-[var(--theme-primary)] border-gray-300 rounded focus:ring-[var(--theme-primary)]"
                  />
                  <span className="text-sm text-gray-700">
                    Allow comments on timeline
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="allowReactions"
                    checked={formData.allowReactions}
                    onChange={handleChange}
                    className="w-4 h-4 text-[var(--theme-primary)] border-gray-300 rounded focus:ring-[var(--theme-primary)]"
                  />
                  <span className="text-sm text-gray-700">
                    Allow reactions (likes, etc.)
                  </span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                isLoading={saving}
                disabled={saving}
              >
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/events/${eventId}`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}

