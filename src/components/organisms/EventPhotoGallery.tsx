'use client'

import { useEffect, useState } from 'react'
import { PhotoGallery } from './PhotoGallery'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

interface EventPhotoGalleryProps {
  eventId: string
}

interface Photo {
  id: string
  url: string
  thumbnailUrl?: string
  caption?: string
  uploadedBy?: string
  timestamp?: Date | string
}

export function EventPhotoGallery({ eventId }: EventPhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPhotos() {
      try {
        setLoading(true)
        // Fetch media assets for this event (only images)
        const response = await fetch(`/api/events/${eventId}/media?type=IMAGE&isApproved=true`)
        if (!response.ok) {
          throw new Error('Failed to fetch photos')
        }
        const mediaAssets = await response.json()

        // Transform media assets to photos
        const galleryPhotos: Photo[] = mediaAssets.map((asset: any) => ({
          id: asset.id,
          url: asset.url,
          thumbnailUrl: asset.thumbnailUrl || asset.url,
          caption: asset.caption || undefined,
          uploadedBy: asset.uploadedBy?.name || undefined,
          timestamp: asset.createdAt,
        }))

        setPhotos(galleryPhotos)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load photos')
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
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

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No photos yet. Be the first to share a photo!</p>
      </div>
    )
  }

  return (
    <PhotoGallery
      photos={photos}
      columns={3}
      onPhotoClick={(photo) => {
        // Handle photo click
        console.log('Photo clicked:', photo)
      }}
    />
  )
}

