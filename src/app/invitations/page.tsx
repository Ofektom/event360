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

interface InvitationDesign {
  id: string
  name: string | null
  templateId: string | null
  imageUrl: string | null
  customImage: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
  event: {
    id: string
    title: string
    slug: string | null
    type: string
  }
  template: {
    id: string
    name: string
    preview: string | null
  } | null
}

export default function InvitationsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [designs, setDesigns] = useState<InvitationDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/invitations')
      return
    }
    if (status === 'authenticated') {
      fetchInvitations()
    }
  }, [status, router])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/invitations/user')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error('Failed to fetch invitations')
      }
      const data = await response.json()
      setDesigns(data)
    } catch (error) {
      console.error('Error fetching invitations:', error)
      setError('Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }

  // Group designs by event
  const designsByEvent = designs.reduce((acc, design) => {
    const eventId = design.event.id
    if (!acc[eventId]) {
      acc[eventId] = {
        event: design.event,
        designs: [],
      }
    }
    acc[eventId].designs.push(design)
    return acc
  }, {} as Record<string, { event: InvitationDesign['event']; designs: InvitationDesign[] }>)

  const eventGroups = Object.values(designsByEvent)
  const filteredGroups = selectedEvent
    ? eventGroups.filter((group) => group.event.id === selectedEvent)
    : eventGroups

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Invitations</h1>
            <p className="text-gray-600 mt-2">
              View and manage all your invitation designs
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Filter by Event */}
        {eventGroups.length > 1 && (
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Event:</label>
              <select
                value={selectedEvent || ''}
                onChange={(e) => setSelectedEvent(e.target.value || null)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Events</option>
                {eventGroups.map((group) => (
                  <option key={group.event.id} value={group.event.id}>
                    {group.event.title}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        )}

        {/* Invitations List */}
        {filteredGroups.length === 0 ? (
          <Card className="p-6">
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">💌</div>
              <p className="text-lg font-medium mb-2">No invitations yet</p>
              <p className="text-sm mb-4">
                Create your first invitation design for an event to get started.
              </p>
              <Link href="/timeline">
                <Button variant="primary">Go to Events</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredGroups.map((group) => (
              <Card key={group.event.id} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{group.event.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {group.designs.length} invitation{group.designs.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Link href={`/events/${group.event.id}/invitations`}>
                    <Button variant="outline" size="sm">
                      Manage Invitations
                    </Button>
                  </Link>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.designs.map((design) => (
                    <Link
                      key={design.id}
                      href={`/events/${group.event.id}/invitations?designId=${design.id}`}
                    >
                      <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="aspect-[4/5] bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                          {design.imageUrl || design.customImage ? (
                            <img
                              src={design.imageUrl || design.customImage || ''}
                              alt={design.name || 'Invitation'}
                              className="w-full h-full object-cover"
                            />
                          ) : design.template?.preview ? (
                            <img
                              src={design.template.preview}
                              alt={design.template.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center text-gray-400">
                              <div className="text-4xl mb-2">🎨</div>
                              <p className="text-sm">Preview</p>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {design.name || 'Untitled Design'}
                            </h3>
                            {design.template && (
                              <p className="text-xs text-gray-500">
                                Based on: {design.template.name}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(design.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {design.isDefault && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded ml-2">
                              Default
                            </span>
                          )}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

