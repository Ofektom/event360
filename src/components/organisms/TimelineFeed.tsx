'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import Link from 'next/link'
import { EventCard } from './EventCard'
import { TimelinePost } from './TimelinePost'

interface TimelinePost {
  id: string
  type: 'interaction' | 'media' | 'event'
  author: {
    id: string | null
    name: string
    avatar: string | null
  }
  content: string | null
  event: {
    id: string
    title: string
    slug: string | null
    type: string
    hasProgramme?: boolean
    hasLiveStream?: boolean
    liveStreamUrl?: string | null
    isOwner?: boolean
  }
  ceremony: {
    id: string
    name: string
  } | null
  media: {
    id: string
    url: string
    thumbnailUrl: string | null
    type: string
  } | null
  timestamp: string
  likes: number
  comments: number
  eventDetails?: {
    startDate: string | null
    endDate: string | null
    location: string | null
    mediaCount: number
    inviteeCount: number
  }
}

interface TimelineEvent {
  id: string
  type: 'event'
  author: {
    id: string | null
    name: string
    avatar: string | null
  }
  content: string | null
  event: {
    id: string
    title: string
    slug: string | null
    type: string
    hasProgramme?: boolean
    hasLiveStream?: boolean
    liveStreamUrl?: string | null
    isOwner?: boolean
  }
  timestamp: string
  eventDetails: {
    startDate: string | null
    endDate: string | null
    location: string | null
    mediaCount: number
    inviteeCount: number
  }
  media: Array<{
    id: string
    url: string
    thumbnailUrl: string | null
    type: string
    caption: string | null
  }>
}

export function TimelineFeed() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [posts, setPosts] = useState<TimelinePost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTimeline() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/timeline')
        const data = await response.json()
        
        if (!response.ok) {
          const errorMsg = data.error || 'Failed to fetch timeline'
          const details = data.details ? `\n\nDetails: ${data.details}` : ''
          throw new Error(errorMsg + details)
        }
        
        setEvents(data.events || [])
        setPosts(data.posts || [])
        setError(null)
      } catch (err: any) {
        console.error('Timeline fetch error:', err)
        // Show the actual error message
        const errorMessage = err.message || 'Failed to load timeline'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchTimeline()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Card>
    )
  }

  if (events.length === 0 && posts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          No events yet
        </h2>
        <p className="text-gray-600 mb-6">
          Your timeline will show events you create or are invited to.
        </p>
        <Link href="/events/new">
          <Button variant="primary">Create Your First Event</Button>
        </Link>
      </Card>
    )
  }

  const handleRefresh = () => {
    // Refresh timeline
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      {/* Show events first - each event in one card with all media */}
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
      
      {/* Show interaction posts (comments, guestbook entries) */}
      {posts.map((post) => (
        <TimelinePost key={post.id} post={post} onRefresh={handleRefresh} />
      ))}
    </div>
  )
}

