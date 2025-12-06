'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { LiveStreamPlayer } from '@/components/organisms/LiveStreamPlayer'

interface Ceremony {
  id: string
  name: string
  streamUrl: string | null
  streamKey: string | null
  isStreaming: boolean
  date: string
  startTime: string | null
}

interface Event {
  id: string
  title: string
  slug: string | null
}

export default function StreamingPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCeremony, setSelectedCeremony] = useState<Ceremony | null>(null)
  const [streamUrl, setStreamUrl] = useState('')
  const [streamKey, setStreamKey] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [eventId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [eventRes, ceremoniesRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/ceremonies`),
      ])

      if (!eventRes.ok || !ceremoniesRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const eventData = await eventRes.json()
      const ceremoniesData = await ceremoniesRes.json()

      setEvent(eventData)
      setCeremonies(ceremoniesData)
      
      // Select first ceremony with stream or first ceremony
      const streamCeremony = ceremoniesData.find((c: Ceremony) => c.isStreaming) || ceremoniesData[0]
      if (streamCeremony) {
        setSelectedCeremony(streamCeremony)
        setStreamUrl(streamCeremony.streamUrl || '')
        setStreamKey(streamCeremony.streamKey || '')
      }
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'Failed to load streaming data')
    } finally {
      setLoading(false)
    }
  }

  const handleStartStream = async () => {
    if (!selectedCeremony || !streamUrl) {
      setError('Please select a ceremony and provide a stream URL')
      return
    }

    try {
      setUpdating(true)
      setError(null)

      const response = await fetch(`/api/ceremonies/${selectedCeremony.id}/stream`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamUrl,
          streamKey: streamKey || undefined,
          isStreaming: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start stream')
      }

      const updated = await response.json()
      setSelectedCeremony({ ...selectedCeremony, ...updated, streamUrl, streamKey })
      setCeremonies(ceremonies.map(c => 
        c.id === selectedCeremony.id ? { ...c, ...updated, streamUrl, streamKey } : c
      ))
    } catch (err: any) {
      console.error('Error starting stream:', err)
      setError(err.message || 'Failed to start stream')
    } finally {
      setUpdating(false)
    }
  }

  const handleStopStream = async () => {
    if (!selectedCeremony) return

    try {
      setUpdating(true)
      setError(null)

      const response = await fetch(`/api/ceremonies/${selectedCeremony.id}/stream`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isStreaming: false,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to stop stream')
      }

      const updated = await response.json()
      setSelectedCeremony({ ...selectedCeremony, ...updated })
      setCeremonies(ceremonies.map(c => 
        c.id === selectedCeremony.id ? { ...c, ...updated } : c
      ))
    } catch (err: any) {
      console.error('Error stopping stream:', err)
      setError(err.message || 'Failed to stop stream')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateStreamUrl = async () => {
    if (!selectedCeremony || !streamUrl) {
      setError('Please provide a stream URL')
      return
    }

    try {
      setUpdating(true)
      setError(null)

      const response = await fetch(`/api/ceremonies/${selectedCeremony.id}/stream`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamUrl,
          streamKey: streamKey || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update stream URL')
      }

      const updated = await response.json()
      setSelectedCeremony({ ...selectedCeremony, ...updated, streamUrl, streamKey })
      setCeremonies(ceremonies.map(c => 
        c.id === selectedCeremony.id ? { ...c, ...updated, streamUrl, streamKey } : c
      ))
    } catch (err: any) {
      console.error('Error updating stream URL:', err)
      setError(err.message || 'Failed to update stream URL')
    } finally {
      setUpdating(false)
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

  if (error && !event) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Streaming</h1>
            <p className="text-gray-600 mt-1">{event?.title}</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stream Configuration */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Stream Setup</h2>

              {/* Ceremony Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Ceremony
                </label>
                <select
                  value={selectedCeremony?.id || ''}
                  onChange={(e) => {
                    const ceremony = ceremonies.find(c => c.id === e.target.value)
                    if (ceremony) {
                      setSelectedCeremony(ceremony)
                      setStreamUrl(ceremony.streamUrl || '')
                      setStreamKey(ceremony.streamKey || '')
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {ceremonies.map((ceremony) => (
                    <option key={ceremony.id} value={ceremony.id}>
                      {ceremony.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stream URL */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream URL
                </label>
                <input
                  type="text"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://youtube.com/live/... or HLS URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports YouTube Live, HLS (.m3u8), or other video URLs
                </p>
              </div>

              {/* Stream Key (optional) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream Key (Optional)
                </label>
                <input
                  type="text"
                  value={streamKey}
                  onChange={(e) => setStreamKey(e.target.value)}
                  placeholder="For RTMP streams"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {selectedCeremony?.isStreaming ? (
                  <>
                    <Button
                      onClick={handleUpdateStreamUrl}
                      variant="secondary"
                      className="w-full"
                      disabled={updating}
                    >
                      {updating ? 'Updating...' : 'Update Stream URL'}
                    </Button>
                    <Button
                      onClick={handleStopStream}
                      variant="outline"
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                      disabled={updating}
                    >
                      {updating ? 'Stopping...' : 'Stop Stream'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleStartStream}
                    variant="primary"
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={updating || !streamUrl}
                  >
                    {updating ? 'Starting...' : 'Start Live Stream'}
                  </Button>
                )}
              </div>

              {/* Status */}
              {selectedCeremony && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`text-sm font-medium ${
                      selectedCeremony.isStreaming ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {selectedCeremony.isStreaming ? '🔴 LIVE' : '⚫ Offline'}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Instructions */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">How to Stream</h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Set up your stream on YouTube Live, Facebook Live, or another platform</li>
                <li>Copy the stream URL (or embed URL for YouTube)</li>
                <li>Paste it in the Stream URL field above</li>
                <li>Click "Start Live Stream" to make it visible to guests</li>
              </ol>
            </Card>
          </div>

          {/* Stream Preview */}
          <div className="lg:col-span-2">
            {selectedCeremony?.isStreaming && selectedCeremony.streamUrl ? (
              <LiveStreamPlayer
                streamUrl={selectedCeremony.streamUrl}
                ceremonyName={selectedCeremony.name}
                eventTitle={event?.title}
                eventId={event?.id}
                eventSlug={event?.slug}
                autoPlay={false}
              />
            ) : (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">📹</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Active Stream
                </h3>
                <p className="text-gray-600 mb-6">
                  Configure and start a live stream to see the preview here.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

