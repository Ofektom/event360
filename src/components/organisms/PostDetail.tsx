'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import Link from 'next/link'
import Image from 'next/image'
import { MediaUploadModal } from './MediaUploadModal'

interface PostDetail {
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

interface PostDetailProps {
  postId: string
}

export function PostDetail({ postId }: PostDetailProps) {
  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/posts/${postId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch post')
        }

        setPost(data.post)
      } catch (err: any) {
        console.error('Post fetch error:', err)
        setError(err.message || 'Failed to load post')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600 mb-4">{error || 'Post not found'}</p>
        <Link href="/timeline">
          <Button variant="outline">Back to Timeline</Button>
        </Link>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6">
        {/* Post Header */}
        <div className="flex items-start gap-4 mb-4">
          <Link
            href={post.event.slug ? `/e/${post.event.slug}` : `/events/${post.event.id}`}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            <span className="text-white font-semibold text-lg">
              {post.event.title.charAt(0).toUpperCase()}
            </span>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={post.event.slug ? `/e/${post.event.slug}` : `/events/${post.event.id}`}
                className="font-semibold text-gray-900 hover:text-purple-600"
              >
                {post.event.title}
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <time dateTime={post.timestamp}>
                {new Date(post.timestamp).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </time>
              {post.ceremony && (
                <>
                  <span>•</span>
                  <span>{post.ceremony.name}</span>
                </>
              )}
            </div>
            {/* Show author info on detail page */}
            <div className="mt-2 text-sm text-gray-600">
              Posted by{' '}
              <Link
                href={post.author.id ? `/profile?userId=${post.author.id}` : '#'}
                className="font-medium text-purple-600 hover:underline"
              >
                {post.author.name}
              </Link>
            </div>
          </div>
        </div>

        {/* Post Content */}
        {post.content && (
          <p className="text-gray-800 mb-4 whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}

        {/* Event Details for Event Creation Posts */}
        {post.type === 'event' && post.eventDetails && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="space-y-2 text-sm text-gray-600">
              {post.eventDetails.startDate && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {new Date(post.eventDetails.startDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {post.eventDetails.endDate && 
                      ` - ${new Date(post.eventDetails.endDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}`
                    }
                  </span>
                </div>
              )}
              {post.eventDetails.location && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{post.eventDetails.location}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post Media */}
        {post.media && (
          <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
            {post.media.type === 'IMAGE' ? (
              <div className="relative w-full">
                <Image
                  src={post.media.thumbnailUrl || post.media.url}
                  alt={post.content || 'Post image'}
                  width={800}
                  height={600}
                  className="w-full h-auto object-contain max-h-[600px]"
                />
              </div>
            ) : post.media.type === 'VIDEO' ? (
              <video
                src={post.media.url}
                controls
                className="w-full h-auto max-h-[600px]"
                poster={post.media.thumbnailUrl || undefined}
              >
                Your browser does not support the video tag.
              </video>
            ) : null}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {post.event.hasProgramme && (
              <Link href={post.event.slug ? `/e/${post.event.slug}#programme` : `/events/${post.event.id}#programme`}>
                <Button variant="outline" size="sm" className="w-full text-xs">
                  📅 Order of Event
                </Button>
              </Link>
            )}
            {post.event.hasLiveStream && post.event.liveStreamUrl && (
              <Link href={post.event.liveStreamUrl} target="_blank">
                <Button variant="outline" size="sm" className="w-full text-xs bg-red-50 hover:bg-red-100 text-red-600 border-red-200">
                  🔴 Live Stream
                </Button>
              </Link>
            )}
            {post.event.isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowUploadModal(true)}
              >
                📸 Upload Media
              </Button>
            )}
          </div>
        </div>

        {/* Post Actions */}
        <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
          <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm font-medium">Like</span>
            {post.likes > 0 && (
              <span className="text-xs text-gray-500">({post.likes})</span>
            )}
          </button>
          <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium">Comment</span>
            {post.comments > 0 && (
              <span className="text-xs text-gray-500">({post.comments})</span>
            )}
          </button>
        </div>
      </Card>

      {showUploadModal && (
        <MediaUploadModal
          eventId={post.event.id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

