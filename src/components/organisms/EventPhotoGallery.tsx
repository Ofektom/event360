'use client'

import { useEffect, useState } from 'react'
import { PhotoGallery } from './PhotoGallery'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

interface EventPhotoGalleryProps {
  eventId: string
}

interface MediaItem {
  id: string
  url: string
  thumbnailUrl?: string
  caption?: string
  uploadedBy?: string
  timestamp?: Date | string
  type: 'IMAGE' | 'VIDEO'
}

export function EventPhotoGallery({ eventId }: EventPhotoGalleryProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMedia() {
      try {
        setLoading(true)
        // Fetch media assets for this event (both images and videos)
        const response = await fetch(`/api/events/${eventId}/media?isApproved=true`)
        if (!response.ok) {
          throw new Error('Failed to fetch media')
        }
        const mediaAssets = await response.json()

        // Filter to only include IMAGE and VIDEO types, and transform to media items
        const galleryMedia: MediaItem[] = mediaAssets
          .filter((asset: any) => asset.type === 'IMAGE' || asset.type === 'VIDEO')
          .map((asset: any) => ({
            id: asset.id,
            url: asset.url,
            thumbnailUrl: asset.thumbnailUrl || asset.url,
            caption: asset.caption || undefined,
            uploadedBy: asset.uploadedBy?.name || undefined,
            timestamp: asset.createdAt,
            type: asset.type,
          }))

        setMediaItems(galleryMedia)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load media')
      } finally {
        setLoading(false)
      }
    }

    fetchMedia()
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

  if (mediaItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No photos or videos yet. Be the first to share!</p>
      </div>
    )
  }

  return (
    <PhotoGallery
      photos={mediaItems}
      columns={3}
      onPhotoClick={(photo) => {
        // Handle photo click
        console.log('Media clicked:', photo)
      }}
    />
  )
}

