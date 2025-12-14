'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { BackButton } from '@/components/shared/BackButton'
import Image from 'next/image'
import { getGalleryThumbnailUrl } from '@/lib/cloudinary-utils'

interface Photo {
  id: string
  url: string
  thumbnailUrl: string | null
  caption: string | null
  createdAt: string
  event: {
    id: string
    title: string
  }
}

export default function FeaturedPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeaturedPhotos = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/media/featured')
        if (!response.ok) throw new Error('Failed to fetch featured photos')
        const data = await response.json()
        setPhotos(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load featured photos')
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedPhotos()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorMessage message={error} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton href="/gallery" />
        <h1 className="text-3xl font-bold text-gray-900">Featured Photos</h1>
        
        {photos.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600">No featured photos yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo) => {
              const thumbnailUrl = photo.thumbnailUrl 
                ? getGalleryThumbnailUrl(photo.thumbnailUrl)
                : getGalleryThumbnailUrl(photo.url)
              
              return (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={thumbnailUrl}
                    alt={photo.caption || 'Featured photo'}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover"
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

