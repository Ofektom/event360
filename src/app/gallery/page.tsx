'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import Image from 'next/image'
import Link from 'next/link'
import { getGalleryThumbnailUrl, getOptimizedImageUrl } from '@/lib/cloudinary-utils'

interface Photo {
  id: string
  url: string
  thumbnailUrl: string | null
  caption: string | null
  createdAt: string
  ceremony: {
    id: string
    name: string
  } | null
  uploadedBy: {
    id: string
    name: string
    image: string | null
  } | null
  likeCount: number
  viewCount: number
}

interface EventGroup {
  event: {
    id: string
    title: string
    slug: string | null
    type: string
  }
  photos: Photo[]
}

interface DateGroup {
  date: string
  photos: Photo[]
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [byEvent, setByEvent] = useState<EventGroup[]>([])
  const [byDate, setByDate] = useState<DateGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'events' | 'dates'>('all')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/photos')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch photos')
      }

      setPhotos(data.photos || [])
      setByEvent(data.categorized?.byEvent || [])
      setByDate(data.categorized?.byDate || [])
    } catch (err: any) {
      console.error('Error fetching photos:', err)
      setError(err.message || 'Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

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

  const renderPhotoGrid = (photoList: Photo[]) => {
    if (photoList.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p>No photos found</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {photoList.map((photo, index) => {
          // Use optimized thumbnail URL for faster loading
          const thumbnailUrl = photo.thumbnailUrl 
            ? getGalleryThumbnailUrl(photo.thumbnailUrl)
            : getGalleryThumbnailUrl(photo.url)
          
          return (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedPhoto(photo)}
            >
              <Image
                src={thumbnailUrl}
                alt={photo.caption || 'Photo'}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover"
                loading={index < 12 ? 'eager' : 'lazy'} // Load first 12 eagerly, rest lazily
                quality={80}
              />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Photos</h1>
            <p className="text-gray-600 mt-1">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              viewMode === 'all'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Photos
          </button>
          <button
            onClick={() => setViewMode('events')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              viewMode === 'events'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Event
          </button>
          <button
            onClick={() => setViewMode('dates')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              viewMode === 'dates'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Date
          </button>
        </div>

        {/* Content */}
        {viewMode === 'all' && (
          <div>{renderPhotoGrid(photos)}</div>
        )}

        {viewMode === 'events' && (
          <div className="space-y-8">
            {byEvent.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No photos organized by events</p>
              </div>
            ) : (
              byEvent.map((group) => (
                <div key={group.event.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        href={group.event.slug ? `/e/${group.event.slug}` : `/events/${group.event.id}`}
                        className="text-xl font-bold text-gray-900 hover:text-purple-600"
                      >
                        {group.event.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {group.photos.length} {group.photos.length === 1 ? 'photo' : 'photos'}
                      </p>
                    </div>
                  </div>
                  {renderPhotoGrid(group.photos)}
                </div>
              ))
            )}
          </div>
        )}

        {viewMode === 'dates' && (
          <div className="space-y-8">
            {byDate.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No photos organized by date</p>
              </div>
            ) : (
              byDate.map((group) => (
                <div key={group.date} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{group.date}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {group.photos.length} {group.photos.length === 1 ? 'photo' : 'photos'}
                    </p>
                  </div>
                  {renderPhotoGrid(group.photos)}
                </div>
              ))
            )}
          </div>
        )}

        {/* Photo Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <Image
                src={getOptimizedImageUrl(selectedPhoto.url, 1200)}
                alt={selectedPhoto.caption || 'Photo'}
                width={1200}
                height={800}
                className="max-w-full max-h-[90vh] object-contain"
                quality={90}
                priority
              />
              {(selectedPhoto.caption || selectedPhoto.uploadedBy) && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4">
                  {selectedPhoto.caption && <p>{selectedPhoto.caption}</p>}
                  {selectedPhoto.uploadedBy && (
                    <p className="text-sm text-gray-300 mt-1">
                      By {selectedPhoto.uploadedBy.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

