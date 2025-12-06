'use client'

import { useState, useEffect } from 'react'
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
    type: string
  }
  updatedAt: string
}

export default function LiveStreamsPage() {
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null)

  useEffect(() => {
    fetchLiveStreams()
    // Poll for new streams every 15 seconds
    const interval = setInterval(fetchLiveStreams, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchLiveStreams = async () => {
    try {
      setError(null)
      const response = await fetch('/api/streams/live')
      
      if (!response.ok) {
        throw new Error('Failed to fetch live streams')
      }

      const data = await response.json()
      setStreams(data.streams || [])
      
      // Auto-select first stream if none selected
      if (!selectedStream && data.streams && data.streams.length > 0) {
        setSelectedStream(data.streams[0])
      }
    } catch (err: any) {
      console.error('Error fetching live streams:', err)
      setError(err.message || 'Failed to load live streams')
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Streams</h1>
          <p className="text-gray-600 mt-1">
            {streams.length} {streams.length === 1 ? 'stream' : 'streams'} currently live
          </p>
        </div>

        {streams.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Live Streams
            </h3>
            <p className="text-gray-600">
              There are currently no live streams available.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stream List */}
            <div className="lg:col-span-1 space-y-3">
              {streams.map((stream) => (
                <Card
                  key={stream.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedStream?.id === stream.id
                      ? 'ring-2 ring-purple-500 bg-purple-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedStream(stream)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                      LIVE
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {stream.name}
                      </h3>
                      <Link
                        href={stream.event.slug ? `/e/${stream.event.slug}` : `/events/${stream.event.id}`}
                        className="text-sm text-purple-600 hover:text-purple-700 truncate block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {stream.event.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">
                        Started {new Date(stream.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Stream Player */}
            <div className="lg:col-span-2">
              {selectedStream ? (
                <LiveStreamPlayer
                  streamUrl={selectedStream.streamUrl}
                  ceremonyName={selectedStream.name}
                  eventTitle={selectedStream.event.title}
                  eventId={selectedStream.event.id}
                  eventSlug={selectedStream.event.slug}
                  autoPlay={true}
                />
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-gray-600">Select a stream to watch</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

