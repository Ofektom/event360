'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { MediaUploadModal } from '@/components/organisms/MediaUploadModal'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { BackButton } from '@/components/shared/BackButton'
import Image from 'next/image'
import { getGalleryThumbnailUrl, getOptimizedImageUrl } from '@/lib/cloudinary-utils'

interface MediaAsset {
  id: string
  type: 'IMAGE' | 'VIDEO'
  url: string
  thumbnailUrl: string | null
  filename: string
  caption: string | null
  createdAt: string
  uploadedBy: {
    id: string
    name: string | null
    image: string | null
  } | null
}

export default function EventGalleryPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const eventId = params.eventId as string

  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch media assets
  useEffect(() => {
    if (status === 'loading') return

    const fetchMedia = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${eventId}/media`)
        if (!response.ok) {
          throw new Error('Failed to fetch media')
        }
        const data = await response.json()
        setMediaAssets(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load media')
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchMedia()
    }
  }, [eventId, status])

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(mediaId)
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete media')
      }

      // Remove from local state
      setMediaAssets((prev) => prev.filter((media) => media.id !== mediaId))
    } catch (err: any) {
      alert(err.message || 'Failed to delete media')
    } finally {
      setDeletingId(null)
    }
  }

  const handleUploadSuccess = () => {
    setShowUploadModal(false)
    // Refresh media list
    const fetchMedia = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/media`)
        if (response.ok) {
          const data = await response.json()
          setMediaAssets(data)
        }
      } catch (err) {
        console.error('Failed to refresh media:', err)
      }
    }
    fetchMedia()
  }

  if (status === 'loading' || loading) {
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <BackButton href={`/events/${eventId}`} />
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Event Gallery</h1>
            <p className="text-gray-600 mt-2">
              Manage photos and videos for your event
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowUploadModal(true)}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Media
          </Button>
        </div>

        {/* Media Grid */}
        {mediaAssets.length === 0 ? (
          <Card className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No media yet</h3>
            <p className="text-gray-600 mb-4">Upload photos and videos to share with your guests</p>
            <Button variant="primary" onClick={() => setShowUploadModal(true)}>
              Upload Your First Media
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {mediaAssets.map((media, index) => {
              // Use optimized thumbnail URL for faster loading (same as working gallery page)
              const thumbnailUrl = media.thumbnailUrl 
                ? getGalleryThumbnailUrl(media.thumbnailUrl)
                : getGalleryThumbnailUrl(media.url)
              
              return (
                <div
                  key={media.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                >
                  {media.type === 'IMAGE' ? (
                    <>
                      <Image
                        src={thumbnailUrl}
                        alt={media.caption || media.filename}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover"
                        loading={index < 12 ? 'eager' : 'lazy'}
                        quality={80}
                      />
                      {/* Overlay with delete button - only visible on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(media.id)
                          }}
                          disabled={deletingId === media.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white p-2 rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
                          title="Delete media"
                        >
                          {deletingId === media.id ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {/* Caption overlay */}
                      {media.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <p className="text-sm truncate">{media.caption}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
                      <video
                        src={media.url}
                        className="w-full h-full object-cover"
                        controls={false}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-12 h-12 text-white opacity-75" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      {/* Overlay with delete button for videos */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(media.id)
                          }}
                          disabled={deletingId === media.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white p-2 rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
                          title="Delete media"
                        >
                          {deletingId === media.id ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <MediaUploadModal
            eventId={eventId}
            onClose={() => setShowUploadModal(false)}
            onSuccess={handleUploadSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

