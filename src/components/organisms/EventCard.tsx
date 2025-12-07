'use client'

import { useState, useEffect } from 'react'
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
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
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
    // If comments are not shown, show them first, otherwise open modal
    if (!showComments && comments > 0) {
      toggleComments(e)
    } else {
      setShowCommentModal(true)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Load comments on mount if there are any
  useEffect(() => {
    if (comments > 0) {
      fetchComments()
    }
  }, [comments])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/events/${event.event.id}/interactions?type=COMMENT`)
      if (response.ok) {
        const data = await response.json()
        // Filter to only top-level comments (no parentId) - replies should be nested, not separate
        // Double-check: filter out any items that have a parentId (these are replies)
        const allCommentIds = new Set(data.map((c: any) => c.id))
        const topLevelComments = data
          .filter((c: any) => {
            // Only include if it has no parentId (top-level comment)
            // AND it's not a reply to another comment in this list
            return !c.parentId || !allCommentIds.has(c.parentId)
          })
          .filter((c: any) => !c.parentId) // Final filter to ensure only top-level
          .map((comment: any) => {
            // Ensure replies are properly nested and filtered
            if (comment.replies && Array.isArray(comment.replies)) {
              return {
                ...comment,
                replies: comment.replies.filter((r: any) => r.parentId === comment.id)
              }
            }
            return comment
          })
        setEventComments(topLevelComments)
        setShowComments(true)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const toggleComments = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!showComments && eventComments.length === 0) {
      fetchComments()
    } else {
      setShowComments(!showComments)
    }
  }

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmittingComment) return

    try {
      setIsSubmittingComment(true)
      const response = await fetch(`/api/events/${event.event.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'COMMENT',
          content: newComment.trim(),
        }),
      })

      if (!response.ok) throw new Error('Failed to post comment')

      const newCommentData = await response.json()
      setEventComments(prev => [newCommentData, ...prev])
      setNewComment('')
      setComments(prev => prev + 1)
      
      // Refresh comment count
      const likeResponse = await fetch(`/api/events/${event.event.id}/like`)
      if (likeResponse.ok) {
        const likeData = await likeResponse.json()
        setComments(likeData.commentCount)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || isSubmittingComment) return

    try {
      setIsSubmittingComment(true)
      const response = await fetch(`/api/events/${event.event.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'COMMENT',
          content: replyContent.trim(),
          parentId,
        }),
      })

      if (!response.ok) throw new Error('Failed to post reply')

      const newReply = await response.json()
      setEventComments(prev => prev.map(c => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies || []), newReply] }
        }
        return c
      }))
      setReplyContent('')
      setReplyingTo(null)
      setComments(prev => prev + 1)
    } catch (error) {
      console.error('Error posting reply:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const renderComment = (comment: any, isReply = false, depth = 0) => {
    const fullName = comment.user?.name || comment.guestName || 'Anonymous'
    // Show only first 2 names (first name and last name)
    const nameParts = fullName.split(' ')
    const authorName = nameParts.length > 2 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : fullName
    const authorImage = comment.user?.image
    const hasReplies = comment.replies && comment.replies.length > 0
    const isExpanded = expandedReplies.has(comment.id)
    const marginLeft = isReply ? Math.min(depth * 16, 48) : 0

    return (
      <div key={comment.id} style={{ marginLeft: `${marginLeft}px` }} className={isReply ? 'mt-2' : 'mb-3'}>
        <div className="flex gap-2">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {authorImage ? (
              <Image
                src={authorImage}
                alt={authorName}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {authorName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-gray-100 rounded-2xl px-3 py-2 inline-block max-w-full">
              <span className="font-semibold text-sm text-gray-900">{authorName}</span>
              {' '}
              <span className="text-sm text-gray-800 whitespace-pre-wrap break-words">{comment.content}</span>
            </div>

            {/* Like and Reply buttons */}
            <div className="flex items-center gap-4 mt-1 ml-1">
              <button className="text-xs text-gray-600 hover:underline font-medium">
                Like
              </button>
              <button
                onClick={() => {
                  if (replyingTo === comment.id) {
                    setReplyingTo(null)
                    setReplyContent('')
                  } else {
                    setReplyingTo(comment.id)
                    setReplyContent('')
                  }
                }}
                className="text-xs text-gray-600 hover:underline font-medium"
              >
                Reply
              </button>
              <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmitReply(comment.id)
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyContent.trim() || isSubmittingComment}
                  className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            )}

            {/* View Replies Button */}
            {hasReplies && !isReply && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-xs text-gray-600 hover:underline font-medium mt-1 ml-1"
              >
                {isExpanded ? 'Hide' : 'View'} {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
              </button>
            )}

            {/* Nested Replies */}
            {hasReplies && isExpanded && (
              <div className="mt-2">
                {comment.replies!.map((reply: any) => renderComment(reply, true, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
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

      {/* Comments Section - Facebook style, show below action buttons */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        {/* View Comments Link - Facebook style */}
        {comments > 0 && !showComments && (
          <button
            onClick={toggleComments}
            className="text-sm text-gray-600 hover:underline mb-2"
          >
            View {comments > 1 ? 'more ' : ''}{comments} {comments === 1 ? 'comment' : 'comments'}
          </button>
        )}

        {/* Comments List - Facebook Style */}
        {showComments && eventComments.length > 0 && (
          <div className="space-y-1 mb-2">
            {/* Show first 2 comments, then "View more comments" */}
            {/* Only render top-level comments - replies will be nested via renderComment */}
            {eventComments
              .filter((c: any) => !c.parentId) // Extra safety: ensure only top-level
              .slice(0, 2)
              .map((comment: any) => renderComment(comment))}
            
            {eventComments.filter((c: any) => !c.parentId).length > 2 && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowCommentModal(true)
                }}
                className="text-sm text-gray-600 hover:underline font-medium mt-2"
              >
                View more comments
              </button>
            )}
          </div>
        )}

        {/* Comment Input - Always visible when comments are shown */}
        {showComments && (
          <form onSubmit={handleSubmitComment} className="flex gap-2 items-start mt-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">Y</span>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 text-sm bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                disabled={isSubmittingComment}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitComment(e as any)
                  }
                }}
              />
            </div>
          </form>
        )}
      </div>

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



