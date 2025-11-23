'use client'

import { useState } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import Link from 'next/link'
import Image from 'next/image'
import { MediaUploadModal } from './MediaUploadModal'

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

interface TimelinePostProps {
  post: TimelinePost
  onRefresh?: () => void
}

export function TimelinePost({ post, onRefresh }: TimelinePostProps) {
  const [showUploadModal, setShowUploadModal] = useState(false)

  return (
    <>
      <Card className="p-4 shadow-sm">
        {/* Post Header - Show Event Name (like Facebook shows person's name) */}
        <div className="flex items-start gap-3 mb-3">
          {/* Event Avatar/Icon */}
          <Link
            href={post.event.slug ? `/e/${post.event.slug}` : `/events/${post.event.id}`}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0"
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
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <time dateTime={post.timestamp}>
                {new Date(post.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
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
          </div>
        </div>

        {/* Post Content */}
        {post.content && (
          <p className="text-gray-800 mb-4 whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}

        {/* Event Creation Post - Show event details */}
        {post.type === 'event' && post.eventDetails && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🎉</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{post.event.title}</h3>
                <div className="space-y-1 text-sm text-gray-600">
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
                  <div className="flex items-center gap-4 pt-2">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{post.eventDetails.mediaCount} photos</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{post.eventDetails.inviteeCount} guests</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post Media - Prominently displayed like Facebook */}
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

        {/* Post Actions (Like, Comment, View Post) - Like Facebook */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-sm font-medium">Like</span>
            {post.likes > 0 && (
              <span className="text-xs text-gray-500">({post.likes})</span>
            )}
          </button>
          <Link
            href={`/posts/${post.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm font-medium">Comment</span>
            {post.comments > 0 && (
              <span className="text-xs text-gray-500">({post.comments})</span>
            )}
          </Link>
          <Link
            href={`/posts/${post.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="text-sm font-medium">View Post</span>
          </Link>
        </div>
      </Card>

      {showUploadModal && (
        <MediaUploadModal
          eventId={post.event.id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            onRefresh?.()
          }}
        />
      )}
    </>
  )
}

