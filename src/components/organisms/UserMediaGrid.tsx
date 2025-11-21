'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MediaCard } from '@/components/molecules/MediaCard'

interface MediaAsset {
  id: string
  url: string
  thumbnailUrl?: string | null
  caption?: string | null
  type: string
  event: {
    id: string
    title: string
    slug?: string | null
  }
  createdAt: string
}

interface UserMediaGridProps {
  mediaAssets: MediaAsset[]
}

export function UserMediaGrid({ mediaAssets }: UserMediaGridProps) {
  if (mediaAssets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>You haven't uploaded any media yet.</p>
      </div>
    )
  }

  // Filter to only show images and videos
  const visualMedia = mediaAssets.filter(
    (media) => media.type === 'IMAGE' || media.type === 'VIDEO'
  )

  if (visualMedia.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No visual media to display.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {visualMedia.map((media) => (
        <Link
          key={media.id}
          href={media.event.slug ? `/e/${media.event.slug}` : `/events/${media.event.id}`}
          className="block"
        >
          <div className="relative aspect-square rounded-lg overflow-hidden group">
            {media.type === 'IMAGE' ? (
              <Image
                src={media.thumbnailUrl || media.url}
                alt={media.caption || media.event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <span className="text-white text-4xl">▶️</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
              <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-center px-2">
                <p className="text-sm font-medium truncate">{media.event.title}</p>
                {media.caption && (
                  <p className="text-xs mt-1 line-clamp-2">{media.caption}</p>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

