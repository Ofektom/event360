'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import Image from 'next/image'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    image: string | null
  } | null
  guestName: string | null
  replies?: Comment[]
}

interface CommentModalProps {
  eventId: string
  eventTitle: string
  onClose: () => void
  onSuccess?: () => void
}

export function CommentModal({ eventId, eventTitle, onClose, onSuccess }: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [comment, setComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/events/${eventId}/interactions?type=COMMENT`)
        if (!response.ok) {
          throw new Error('Failed to fetch comments')
        }
        const data = await response.json()
        // Filter to only top-level comments (no parentId)
        const topLevelComments = data.filter((c: any) => !c.parentId)
        setComments(topLevelComments)
      } catch (err: any) {
        console.error('Error fetching comments:', err)
        setError(err.message || 'Failed to load comments')
      } finally {
        setIsLoading(false)
      }
    }

    fetchComments()
  }, [eventId])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const content = replyingTo ? replyContent.trim() : comment.trim()
    if (!content) {
      setError(replyingTo ? 'Please enter a reply' : 'Please enter a comment')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch(`/api/events/${eventId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'COMMENT',
          content,
          ...(replyingTo && { parentId: replyingTo }),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to post comment')
      }

      const newComment = await response.json()
      
      if (replyingTo) {
        // Add reply to the appropriate comment
        setComments(prev => prev.map(c => {
          if (c.id === replyingTo) {
            return {
              ...c,
              replies: [...(c.replies || []), newComment],
            }
          }
          // Check nested replies
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map(r => {
                if (r.id === replyingTo) {
                  return {
                    ...r,
                    replies: [...(r.replies || []), newComment],
                  }
                }
                return r
              }),
            }
          }
          return c
        }))
        setReplyContent('')
        setReplyingTo(null)
      } else {
        // Add new top-level comment
        setComments(prev => [newComment, ...prev])
        setComment('')
      }
      
      onSuccess?.()
    } catch (err: any) {
      console.error('Error posting comment:', err)
      setError(err.message || 'Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const renderComment = (comment: Comment, isReply = false, depth = 0) => {
    const authorName = comment.user?.name || comment.guestName || 'Anonymous'
    const authorImage = comment.user?.image
    const hasReplies = comment.replies && comment.replies.length > 0
    const isExpanded = expandedReplies.has(comment.id)
    const marginLeft = isReply ? Math.min(depth * 16, 48) : 0

    return (
      <div key={comment.id} style={{ marginLeft: `${marginLeft}px` }} className={isReply ? 'mt-3' : 'mb-4'}>
        <div className="flex gap-3">
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
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-gray-900">{authorName}</span>
                <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{comment.content}</p>
            </div>

            {/* Reply Button */}
            <div className="mt-1 flex items-center gap-4">
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
                className="text-xs text-gray-600 hover:text-purple-600 font-medium"
              >
                Reply
              </button>
              {hasReplies && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="text-xs text-gray-600 hover:text-purple-600 font-medium"
                >
                  {isExpanded ? 'Hide' : 'View'} {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <form onSubmit={handleSubmit} className="mt-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                  autoFocus
                />
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting || !replyContent.trim()}
                  >
                    {isSubmitting ? 'Posting...' : 'Post Reply'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Nested Replies */}
            {hasReplies && isExpanded && (
              <div className="mt-3 space-y-3">
                {comment.replies!.map(reply => renderComment(reply, true, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col p-6">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Comments</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4 flex-shrink-0">
          Commenting on: <span className="font-semibold">{eventTitle}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto mb-4 pr-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => renderComment(comment))}
            </div>
          )}
        </div>

        {/* New Comment Form */}
        <form onSubmit={handleSubmit} className="flex-shrink-0 border-t border-gray-200 pt-4">
          <div className="mb-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={isSubmitting || replyingTo !== null}
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !comment.trim() || replyingTo !== null}
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
