'use client'

import { Card } from '@/components/atoms/Card'
import Image from 'next/image'

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

interface TimelineProps {
  posts: TimelinePost[]
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
}

export function Timeline({ posts, onLike, onComment, onShare }: TimelineProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.round((d.getTime() - Date.now()) / (1000 * 60)),
      'minute'
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {posts.map((post) => (
        <Card key={post.id} variant="elevated" padding="none" className="overflow-hidden">
          {/* Post Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
              {post.authorAvatar ? (
                <Image
                  src={post.authorAvatar}
                  alt={post.author}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                post.author.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{post.author}</h4>
              <p className="text-sm text-gray-500">{formatDate(post.timestamp)}</p>
            </div>
          </div>

          {/* Post Content */}
          <div className="p-4">
            <p className="text-gray-900 mb-4 whitespace-pre-wrap">{post.content}</p>

            {/* Post Media */}
            {post.image && (
              <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden">
                <Image
                  src={post.image}
                  alt="Post image"
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {post.video && (
              <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden">
                <video
                  src={post.video}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => onLike?.(post.id)}
              className="flex items-center gap-2 text-gray-600 hover:text-[var(--theme-primary)] transition-colors"
            >
              <span className="text-xl">❤️</span>
              <span className="text-sm font-medium">{post.likes}</span>
            </button>
            <button
              onClick={() => onComment?.(post.id)}
              className="flex items-center gap-2 text-gray-600 hover:text-[var(--theme-primary)] transition-colors"
            >
              <span className="text-xl">💬</span>
              <span className="text-sm font-medium">{post.comments}</span>
            </button>
            <button
              onClick={() => onShare?.(post.id)}
              className="flex items-center gap-2 text-gray-600 hover:text-[var(--theme-primary)] transition-colors"
            >
              <span className="text-xl">🔗</span>
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}

