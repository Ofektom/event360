'use client'

import { useState } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import Link from 'next/link'
import Image from 'next/image'
import { CommentModal } from './CommentModal'

interface MediaItem {
  id: string
  url: string
  thumbnailUrl: string | null
  type: string
  caption: string | null
}

interface EventCardProps {
  event: {
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
    media: MediaItem[]
    likes?: number
    comments?: number
    hasLiked?: boolean
  }
  onRefresh?: () => void
}

export function EventCard({ event, onRefresh }: EventCardProps) {
  const eventUrl = event.event.slug ? `/e/${event.event.slug}` : `/events/${event.event.id}`
  const liveStreamUrl = `/events/${event.event.id}/live`
  const displayMedia = event.media.slice(0, 6) // Show up to 6 media items in preview
  const remainingMediaCount = event.media.length - displayMedia.length
  const [copied, setCopied] = useState(false)
  const [likes, setLikes] = useState(event.likes || 0)
  const [hasLiked, setHasLiked] = useState(event.hasLiked || false)
  const [comments, setComments] = useState(event.comments || 0)
  const [isLiking, setIsLiking] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [eventComments, setEventComments] = useState<any[]>([])
  const isLive = event.event.hasLiveStream && event.event.liveStreamUrl

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const fullUrl = `${window.location.origin}${liveStreamUrl}`
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch((err) => {
      console.error('Failed to copy:', err)
    })
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLiking) return
    
    try {
      setIsLiking(true)
      const response = await fetch(`/api/events/${event.event.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to toggle like')
      }

      const data = await response.json()
      setHasLiked(data.hasLiked)
      setLikes(data.likeCount)
      setComments(data.commentCount)
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleComment = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowCommentModal(true)
  }

  const toggleComments = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!showComments) {
      // Fetch comments when expanding
      try {
        const response = await fetch(`/api/events/${event.event.id}/interactions?type=COMMENT`)
        if (response.ok) {
          const data = await response.json()
          // Filter to only top-level comments
          const topLevelComments = data.filter((c: any) => !c.parentId)
          setEventComments(topLevelComments)
        }
      } catch (error) {
        console.error('Error fetching comments:', error)
      }
    }
    setShowComments(!showComments)
  }

  return (
    <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Event Header */}
      <Link href={eventUrl} className="block">
        <div className="flex items-start gap-3 mb-4">
          {/* Event Avatar/Icon */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0">
            <span className="text-white font-semibold text-xl">
              {event.event.title.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              {event.event.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <time dateTime={event.timestamp}>
                {new Date(event.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            </div>
          </div>
        </div>

        {/* Event Description */}
        {event.content && (
          <p className="text-gray-700 mb-4 line-clamp-2">
            {event.content}
          </p>
        )}

        {/* Event Details Summary */}
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="space-y-2 text-sm">
            {event.eventDetails.startDate && (
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {new Date(event.eventDetails.startDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {event.eventDetails.endDate && 
                    ` - ${new Date(event.eventDetails.endDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}`
                  }
                </span>
              </div>
            )}
            {event.eventDetails.location && (
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{event.eventDetails.location}</span>
              </div>
            )}
            <div className="flex items-center gap-4 pt-1">
              <span className="flex items-center gap-1 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{event.eventDetails.mediaCount} photos</span>
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{event.eventDetails.inviteeCount} guests</span>
              </span>
            </div>
          </div>
        </div>

        {/* Media Grid - Facebook-style layout with minimal gaps */}
        {event.media.length > 0 && (
          <div className="mb-4 rounded-lg overflow-hidden bg-gray-100" style={{ border: '1px solid #e5e7eb' }}>
            {displayMedia.length === 1 ? (
              // Single media item - show large
              <div className="w-full">
                {displayMedia[0].type === 'IMAGE' ? (
                  <div className="relative w-full" style={{ maxHeight: '500px' }}>
                    <Image
                      src={displayMedia[0].thumbnailUrl || displayMedia[0].url}
                      alt={displayMedia[0].caption || 'Event photo'}
                      width={800}
                      height={600}
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: '500px' }}
                    />
                  </div>
                ) : (
                  <video
                    src={displayMedia[0].url}
                    controls
                    className="w-full h-auto"
                    style={{ maxHeight: '500px' }}
                    poster={displayMedia[0].thumbnailUrl || undefined}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : displayMedia.length === 2 ? (
              // Two media items - side by side, no gap
              <div className="grid grid-cols-2" style={{ gap: '1px' }}>
                {displayMedia.map((item) => (
                  <div key={item.id} className="relative" style={{ aspectRatio: '1', backgroundColor: '#f3f4f6' }}>
                    {item.type === 'IMAGE' ? (
                      <Image
                        src={item.thumbnailUrl || item.url}
                        alt={item.caption || 'Event photo'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                        className="w-full h-full object-cover"
                        poster={item.thumbnailUrl || undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ))}
              </div>
            ) : displayMedia.length === 3 ? (
              // Three media items - one large on left, two stacked on right (Facebook style)
              <div className="grid grid-cols-2" style={{ gap: '1px' }}>
                <div className="row-span-2 relative" style={{ aspectRatio: '1', backgroundColor: '#f3f4f6' }}>
                  {displayMedia[0].type === 'IMAGE' ? (
                    <Image
                      src={displayMedia[0].thumbnailUrl || displayMedia[0].url}
                      alt={displayMedia[0].caption || 'Event photo'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <video
                      src={displayMedia[0].url}
                      controls
                      className="w-full h-full object-cover"
                      poster={displayMedia[0].thumbnailUrl || undefined}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
                {displayMedia.slice(1).map((item) => (
                  <div key={item.id} className="relative" style={{ aspectRatio: '1', backgroundColor: '#f3f4f6' }}>
                    {item.type === 'IMAGE' ? (
                      <Image
                        src={item.thumbnailUrl || item.url}
                        alt={item.caption || 'Event photo'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                        className="w-full h-full object-cover"
                        poster={item.thumbnailUrl || undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ))}
              </div>
            ) : displayMedia.length === 4 ? (
              // Four media items - 2x2 grid
              <div className="grid grid-cols-2" style={{ gap: '1px' }}>
                {displayMedia.map((item) => (
                  <div key={item.id} className="relative" style={{ aspectRatio: '1', backgroundColor: '#f3f4f6' }}>
                    {item.type === 'IMAGE' ? (
                      <Image
                        src={item.thumbnailUrl || item.url}
                        alt={item.caption || 'Event photo'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                        className="w-full h-full object-cover"
                        poster={item.thumbnailUrl || undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ))}
              </div>
            ) : displayMedia.length === 5 ? (
              // Five media items - one large on left, 4 in 2x2 grid on right
              <div className="grid grid-cols-3" style={{ gap: '1px' }}>
                <div className="row-span-2 col-span-2 relative" style={{ aspectRatio: '1', backgroundColor: '#f3f4f6' }}>
                  {displayMedia[0].type === 'IMAGE' ? (
                    <Image
                      src={displayMedia[0].thumbnailUrl || displayMedia[0].url}
                      alt={displayMedia[0].caption || 'Event photo'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <video
                      src={displayMedia[0].url}
                      controls
                      className="w-full h-full object-cover"
                      poster={displayMedia[0].thumbnailUrl || undefined}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
                {displayMedia.slice(1, 5).map((item) => (
                  <div key={item.id} className="relative" style={{ aspectRatio: '1', backgroundColor: '#f3f4f6' }}>
                    {item.type === 'IMAGE' ? (
                      <Image
                        src={item.thumbnailUrl || item.url}
                        alt={item.caption || 'Event photo'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                        className="w-full h-full object-cover"
                        poster={item.thumbnailUrl || undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Six or more media items - Facebook style: one large on left, 5 in grid on right
              <div className="grid grid-cols-3" style={{ gap: '1px' }}>
                <div className="row-span-2 col-span-2 relative" style={{ aspectRatio: '1', backgroundColor: '#f3f4f6' }}>
                  {displayMedia[0].type === 'IMAGE' ? (
                    <Image
                      src={displayMedia[0].thumbnailUrl || displayMedia[0].url}
                      alt={displayMedia[0].caption || 'Event photo'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <video
                      src={displayMedia[0].url}
                      controls
                      className="w-full h-full object-cover"
                      poster={displayMedia[0].thumbnailUrl || undefined}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
                {displayMedia.slice(1, 4).map((item) => (
                  <div key={item.id} className="relative" style={{ aspectRatio: '1', backgroundColor: '#f3f4f6' }}>
                    {item.type === 'IMAGE' ? (
                      <Image
                        src={item.thumbnailUrl || item.url}
                        alt={item.caption || 'Event photo'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                        className="w-full h-full object-cover"
                        poster={item.thumbnailUrl || undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ))}
                {displayMedia.length > 4 && (
                  <div className="relative" style={{ aspectRatio: '1', backgroundColor: '#000' }}>
                    {displayMedia[4].type === 'IMAGE' ? (
                      <>
                        <Image
                          src={displayMedia[4].thumbnailUrl || displayMedia[4].url}
                          alt={displayMedia[4].caption || 'Event photo'}
                          fill
                          className="object-cover opacity-60"
                        />
                        {remainingMediaCount > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                            <span className="text-white font-bold text-xl">
                              +{remainingMediaCount}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <video
                        src={displayMedia[4].url}
                        controls
                        className="w-full h-full object-cover"
                        poster={displayMedia[4].thumbnailUrl || undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Link>

      {/* Live Stream Section - Outside the main link */}
      {isLive && (
        <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span className="text-sm font-semibold">LIVE</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Streaming now</p>
                <p className="text-xs text-gray-600">Watch the live stream</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Link
                  </>
                )}
              </Button>
              <Link href={liveStreamUrl}>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-xs"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Watch Live
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Post Actions (Like, Comment, View Post, Watch Live) - Like Facebook */}
      <div className={`flex items-center justify-between pt-3 border-t border-gray-200 ${isLive ? 'grid grid-cols-4 gap-1' : ''}`}>
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
            hasLiked
              ? 'text-purple-600 hover:bg-purple-50'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <svg
            className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`}
            fill={hasLiked ? 'currentColor' : 'none'}
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
          {likes > 0 && (
            <span className="text-xs text-gray-500">({likes})</span>
          )}
        </button>
        <button
          onClick={handleComment}
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
          {comments > 0 && (
            <span className="text-xs text-gray-500">({comments})</span>
          )}
        </button>
        <Link
          href={eventUrl}
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
        {isLive && (
          <Link
            href={liveStreamUrl}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-medium">Watch Live</span>
          </Link>
        )}
      </div>

      {/* Comments Section - Show below action buttons */}
      {comments > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={toggleComments}
            className="text-sm text-gray-600 hover:text-purple-600 font-medium mb-3"
          >
            {showComments ? 'Hide' : 'View'} {comments} {comments === 1 ? 'comment' : 'comments'}
          </button>
          
          {showComments && eventComments.length > 0 && (
            <div className="space-y-3 mt-3">
              {eventComments.slice(0, 3).map((comment: any) => {
                const authorName = comment.user?.name || comment.guestName || 'Anonymous'
                return (
                  <div key={comment.id} className="flex gap-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-xs text-gray-900">{authorName}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              {comments > 3 && (
                <button
                  onClick={handleComment}
                  className="text-sm text-gray-600 hover:text-purple-600 font-medium"
                >
                  View all {comments} comments
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <CommentModal
          eventId={event.event.id}
          eventTitle={event.event.title}
          onClose={() => setShowCommentModal(false)}
          onSuccess={async () => {
            // Refresh comment count and comments list after successful comment
            try {
              const response = await fetch(`/api/events/${event.event.id}/like`)
              if (response.ok) {
                const data = await response.json()
                setComments(data.commentCount)
              }
              // Refresh comments list if it's currently shown
              if (showComments) {
                const commentsResponse = await fetch(`/api/events/${event.event.id}/interactions?type=COMMENT`)
                if (commentsResponse.ok) {
                  const commentsData = await commentsResponse.json()
                  const topLevelComments = commentsData.filter((c: any) => !c.parentId)
                  setEventComments(topLevelComments)
                }
              }
            } catch (error) {
              console.error('Error refreshing comment count:', error)
            }
          }}
        />
      )}
    </Card>
  )
}


