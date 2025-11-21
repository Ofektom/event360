'use client'

import { useEffect, useState } from 'react'
import { Timeline } from './Timeline'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

interface EventTimelineProps {
  eventId: string
}

interface TimelinePost {
  id: string
  author: string
  authorAvatar?: string
  content: string
  image?: string
  video?: string
  timestamp: Date | string
  likes: number
  comments: number
  reactions?: Array<{ type: string; count: number }>
}

export function EventTimeline({ eventId }: EventTimelineProps) {
  const [posts, setPosts] = useState<TimelinePost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTimeline() {
      try {
        setLoading(true)
        // Fetch interactions for this event
        const response = await fetch(`/api/events/${eventId}/interactions?type=POST`)
        if (!response.ok) {
          throw new Error('Failed to fetch timeline')
        }
        const interactions = await response.json()

        // Transform interactions to timeline posts
        const timelinePosts: TimelinePost[] = interactions.map((interaction: any) => ({
          id: interaction.id,
          author: interaction.user?.name || 'Anonymous',
          authorAvatar: interaction.user?.image || undefined,
          content: interaction.content || '',
          image: interaction.mediaAsset?.url || undefined,
          video: interaction.mediaAsset?.type === 'VIDEO' ? interaction.mediaAsset.url : undefined,
          timestamp: interaction.createdAt,
          likes: interaction._count?.likes || 0,
          comments: interaction._count?.comments || 0,
        }))

        setPosts(timelinePosts)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load timeline')
      } finally {
        setLoading(false)
      }
    }

    fetchTimeline()
  }, [eventId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No posts yet. Be the first to share something!</p>
      </div>
    )
  }

  return (
    <Timeline
      posts={posts}
      onLike={(postId) => {
        // Handle like
        console.log('Like post:', postId)
      }}
      onComment={(postId) => {
        // Handle comment
        console.log('Comment on post:', postId)
      }}
      onShare={(postId) => {
        // Handle share
        console.log('Share post:', postId)
      }}
    />
  )
}

