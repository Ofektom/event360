'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { EventHeader } from '@/components/organisms/EventHeader'
import { ShareEventModal } from '@/components/organisms/ShareEventModal'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { EventVendorsList } from '@/components/organisms/EventVendorsList'

interface Event {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  slug?: string | null
  qrCode?: string | null
  shareLink?: string | null
  startDate: string | null
  endDate: string | null
  location: string | null
  ceremonies: Ceremony[]
  _count: {
    invitees: number
    mediaAssets: number
    interactions: number
    eventVendors: number
  }
}

interface EventStats {
  invitationDesigns: number
  rsvpBreakdown: {
    accepted: number
    pending: number
    declined: number
    maybe: number
  }
  totalInvites: number
}

interface Invitee {
  id: string
  name: string
  email: string | null
  phone: string | null
  rsvpStatus: string
  role: string | null
}

interface InvitationDesign {
  id: string
  name: string
  imageUrl: string | null
  isDefault: boolean
}

interface Ceremony {
  id: string
  name: string
  description: string | null
  order: number
  date: string
  location: string | null
  venue: string | null
  streamUrl: string | null
  isStreaming: boolean
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const eventId = params.eventId as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [stats, setStats] = useState<EventStats | null>(null)
  const [invitees, setInvitees] = useState<Invitee[]>([])
  const [invitationDesigns, setInvitationDesigns] = useState<InvitationDesign[]>([])

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
      const [eventResponse, designsResponse, inviteesResponse] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/invitations/designs?eventId=${eventId}`),
        fetch(`/api/events/${eventId}/invitees`),
      ])

      if (!eventResponse.ok) {
        if (eventResponse.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error('Failed to fetch event')
      }

      const eventData = await eventResponse.json()
      setEvent(eventData)

      // Check if current user is the owner
      const userIsOwner = session?.user?.id && eventData.ownerId === session.user.id
      setIsOwner(userIsOwner || false)

      // Fetch additional stats (only for owners)
      if (userIsOwner) {
        try {
          const [designsData, inviteesData] = await Promise.all([
            designsResponse.ok ? designsResponse.json() : Promise.resolve([]),
            inviteesResponse.ok ? inviteesResponse.json() : Promise.resolve([]),
          ])

          // Calculate RSVP breakdown
          const rsvpBreakdown = {
            accepted: inviteesData.filter((i: any) => i.rsvpStatus === 'ACCEPTED').length,
            pending: inviteesData.filter((i: any) => i.rsvpStatus === 'PENDING').length,
            declined: inviteesData.filter((i: any) => i.rsvpStatus === 'DECLINED').length,
            maybe: inviteesData.filter((i: any) => i.rsvpStatus === 'MAYBE').length,
          }

          // Count total invites sent
          const totalInvites = inviteesData.reduce((sum: number, invitee: any) => {
            return sum + (invitee._count?.invites || 0)
          }, 0)

          setStats({
            invitationDesigns: designsData.length || 0,
            rsvpBreakdown,
            totalInvites,
          })

          // Store invitees and designs for display
          setInvitees(inviteesData.slice(0, 10)) // Show first 10 invitees
          setInvitationDesigns(designsData)
        } catch (statsError) {
          console.error('Error fetching stats:', statsError)
          // Set default stats if fetch fails
          setStats({
            invitationDesigns: 0,
            rsvpBreakdown: { accepted: 0, pending: 0, declined: 0, maybe: 0 },
            totalInvites: 0,
          })
        }
      }
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
        <div className="mb-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Event Header */}
        <EventHeader
          title={event.title}
          description={event.description || undefined}
          startDate={event.startDate ? new Date(event.startDate) : undefined}
          endDate={event.endDate ? new Date(event.endDate) : undefined}
          location={event.location || undefined}
        />

        {/* Continue Setup Section */}
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Continue Setup</h2>
          <p className="text-sm text-gray-600 mb-6">
            Complete your event setup by adding these features
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Design Invitations */}
            <Link href={`/events/${eventId}/invitations`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">💌</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Design Invitations</h3>
                    <p className="text-xs text-gray-600">Create or upload invitation designs</p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Invite Guests */}
            <Link href={`/events/${eventId}/invitees`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📨</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Invite Guests</h3>
                    <p className="text-xs text-gray-600">Manage guest list & RSVPs</p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Create Order of Events */}
            <Link href={`/events/${eventId}/ceremonies/new`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📅</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create Programme</h3>
                    <p className="text-xs text-gray-600">Add ceremonies & schedule</p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Generate QR Code & Share Link */}
            <Card 
              className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white" 
              onClick={() => setShowShareModal(true)}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">🔗</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Share Event</h3>
                  <p className="text-xs text-gray-600">Get QR code & share link</p>
                </div>
              </div>
            </Card>

            {/* Customize Theme */}
            <Link href={`/events/${eventId}/theme`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🎨</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Customize Theme</h3>
                    <p className="text-xs text-gray-600">Design your event page</p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Upload Media */}
            <Link href={`/events/${eventId}/gallery`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📸</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Upload Photos</h3>
                    <p className="text-xs text-gray-600">Add event media</p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Live Streaming */}
            <Link href={`/events/${eventId}/streaming`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📹</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Live Streaming</h3>
                    <p className="text-xs text-gray-600">Set up live streams</p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* View Public Page */}
            {event.slug && (
              <Link href={`/e/${event.slug}`} target="_blank">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">👁️</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">View Public Page</h3>
                      <p className="text-xs text-gray-600">Preview guest view</p>
                    </div>
                  </div>
                </Card>
              </Link>
          )}
        </div>
        </Card>

        {/* Live Stream Banner */}
        {event.ceremonies.some(c => c.isStreaming && c.streamUrl) && (
          <Card className="p-6 bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  <span className="font-semibold">LIVE NOW</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {event.ceremonies.find(c => c.isStreaming)?.name} is streaming live
                  </h3>
                  <p className="text-sm text-gray-600">Watch the live stream now</p>
                </div>
              </div>
              <Link href={`/events/${eventId}/live`}>
                <Button variant="primary" className="bg-red-600 hover:bg-red-700">
                  Watch Live
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {stats && (
              <div className="text-xs text-gray-500 mt-1">
                {stats.rsvpBreakdown.accepted} accepted, {stats.rsvpBreakdown.pending} pending
              </div>
            )}
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-blue-600">
              {event._count.mediaAssets}
          </div>
            <div className="text-sm text-gray-600">Photos</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-purple-600">
              {event._count.eventVendors}
          </div>
            <div className="text-sm text-gray-600">Vendors</div>
          </Card>
        </div>

        {/* Additional Stats Row */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="text-2xl font-bold text-indigo-600">
                {stats.invitationDesigns}
              </div>
              <div className="text-sm text-gray-600">Invitation Designs</div>
            </Card>
            <Card className="p-6">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalInvites}
              </div>
              <div className="text-sm text-gray-600">Invites Sent</div>
            </Card>
            <Card className="p-6">
              <div className="text-2xl font-bold text-orange-600">
                {event._count.interactions}
              </div>
              <div className="text-sm text-gray-600">Interactions</div>
            </Card>
            <Card className="p-6">
              <div className="text-2xl font-bold text-teal-600">
                {stats.rsvpBreakdown.accepted + stats.rsvpBreakdown.maybe}
              </div>
              <div className="text-sm text-gray-600">Attending</div>
            </Card>
          </div>
        )}

        {/* RSVP Breakdown - Only for owners */}
        {isOwner && stats && stats.rsvpBreakdown && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">RSVP Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.rsvpBreakdown.accepted}
                </div>
                <div className="text-sm text-gray-600 mt-1">Accepted</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.rsvpBreakdown.pending}
                </div>
                <div className="text-sm text-gray-600 mt-1">Pending</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {stats.rsvpBreakdown.declined}
                </div>
                <div className="text-sm text-gray-600 mt-1">Declined</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.rsvpBreakdown.maybe}
                </div>
                <div className="text-sm text-gray-600 mt-1">Maybe</div>
              </div>
            </div>
          </Card>
        )}

        {/* Ceremonies Section */}
        <Card className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
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
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
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

        {/* Vendors Section */}
        <Card className="p-8">
          <EventVendorsList eventId={eventId} isOwner={isOwner} />
        </Card>

        {/* Guest List Section */}
        {isOwner && (
          <Card className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Guest List</h2>
              <Link href={`/events/${eventId}/invitees`}>
                <Button variant="primary">View All Guests</Button>
              </Link>
            </div>

            {invitees.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">👥</div>
                <p>No guests added yet. Start inviting people to your event!</p>
                <Link href={`/events/${eventId}/invitees`}>
                  <Button variant="primary" className="mt-4">Add Guests</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {invitees.map((invitee) => (
                    <Card key={invitee.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{invitee.name}</h3>
                          {invitee.email && (
                            <p className="text-sm text-gray-600 mb-1">📧 {invitee.email}</p>
                          )}
                          {invitee.phone && (
                            <p className="text-sm text-gray-600 mb-1">📞 {invitee.phone}</p>
                          )}
                          {invitee.role && (
                            <p className="text-xs text-purple-600 mt-1">Role: {invitee.role}</p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            invitee.rsvpStatus === 'ACCEPTED'
                              ? 'bg-green-100 text-green-700'
                              : invitee.rsvpStatus === 'DECLINED'
                              ? 'bg-red-100 text-red-700'
                              : invitee.rsvpStatus === 'MAYBE'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {invitee.rsvpStatus}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
                {event._count.invitees > invitees.length && (
                  <div className="text-center pt-4">
                    <Link href={`/events/${eventId}/invitees`}>
                      <Button variant="secondary">
                        View All {event._count.invitees} Guests →
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Invitation Designs Section */}
        {isOwner && (
          <Card className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Invitation Designs</h2>
              <Link href={`/events/${eventId}/invitations`}>
                <Button variant="primary">Manage Invitations</Button>
              </Link>
            </div>

            {invitationDesigns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">💌</div>
                <p>No invitation designs yet. Create your first invitation design!</p>
                <Link href={`/events/${eventId}/invitations`}>
                  <Button variant="primary" className="mt-4">Create Invitation</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {invitationDesigns.map((design) => (
                  <Link key={design.id} href={`/events/${eventId}/invitations?designId=${design.id}`}>
                    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                      {design.imageUrl ? (
                        <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={design.imageUrl}
                            alt={design.name}
                            className="w-full h-full object-cover"
                          />
                          {design.isDefault && (
                            <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-48 mb-3 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <span className="text-4xl">💌</span>
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900">{design.name}</h3>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* Share Event Modal */}
      {showShareModal && (
        <ShareEventModal
          eventId={eventId}
          shareLink={event.shareLink || null}
          qrCode={event.qrCode || null}
          slug={event.slug || null}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </DashboardLayout>
  )
}

