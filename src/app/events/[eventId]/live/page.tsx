'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { LiveStreamPlayer } from '@/components/organisms/LiveStreamPlayer'
import Link from 'next/link'

interface LiveStream {
  id: string
  name: string
  streamUrl: string
  event: {
    id: string
    title: string
    slug: string | null
  }
}

export default function LiveStreamViewerPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [stream, setStream] = useState<LiveStream | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLiveStream()
    // Poll for stream updates every 10 seconds
    const interval = setInterval(fetchLiveStream, 10000)
    return () => clearInterval(interval)
  }, [eventId])

  const fetchLiveStream = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/events/${eventId}/ceremonies`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch ceremonies')
      }

      const ceremonies = await response.json()
      const liveCeremony = ceremonies.find((c: any) => c.isStreaming && c.streamUrl)

      if (liveCeremony) {
        // Fetch event details
        const eventRes = await fetch(`/api/events/${eventId}`)
        const event = await eventRes.json()

        setStream({
          id: liveCeremony.id,
          name: liveCeremony.name,
          streamUrl: liveCeremony.streamUrl,
          event: {
            id: event.id,
            title: event.title,
            slug: event.slug,
          },
        })
      } else {
        setStream(null)
      }
    } catch (err: any) {
      console.error('Error fetching live stream:', err)
      setError(err.message || 'Failed to load live stream')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorMessage message={error} />
      </DashboardLayout>
    )
  }

  if (!stream) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Live Stream</h1>
          </div>
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Live Stream Available
            </h3>
            <p className="text-gray-600 mb-6">
              There is currently no live stream for this event.
            </p>
            <Link href={`/events/${eventId}`}>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Back to Event
              </button>
            </Link>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Stream</h1>
            <Link
              href={stream.event.slug ? `/e/${stream.event.slug}` : `/events/${stream.event.id}`}
              className="text-purple-600 hover:text-purple-700 mt-1 inline-block"
            >
              {stream.event.title}
            </Link>
          </div>
        </div>

        {/* Live Stream Player */}
        <LiveStreamPlayer
          streamUrl={stream.streamUrl}
          ceremonyName={stream.name}
          eventTitle={stream.event.title}
          eventId={stream.event.id}
          eventSlug={stream.event.slug}
          autoPlay={true}
        />
      </div>
    </DashboardLayout>
  )
}

