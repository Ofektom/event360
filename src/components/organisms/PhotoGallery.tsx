'use client'

import { useState } from 'react'
import { MediaCard } from '@/components/molecules/MediaCard'
import Image from 'next/image'
import { getGalleryThumbnailUrl, getOptimizedImageUrl } from '@/lib/cloudinary-utils'

interface Photo {
  id: string
  url: string
  thumbnailUrl?: string
  caption?: string
  uploadedBy?: string
  timestamp?: Date | string
  type?: 'IMAGE' | 'VIDEO'
}

interface PhotoGalleryProps {
  photos: Photo[]
  columns?: 2 | 3 | 4
  onPhotoClick?: (photo: Photo) => void
}

export function PhotoGallery({ photos, columns = 3, onPhotoClick }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  const columnClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo)
    onPhotoClick?.(photo)
  }

  const isVideo = (photo: Photo) => photo.type === 'VIDEO'

  return (
    <>
      <div className={`grid ${columnClasses[columns]} gap-4`}>
        {photos.map((photo, index) => {
          // Use optimized thumbnail URL for faster loading
          const thumbnailUrl = photo.thumbnailUrl 
            ? getGalleryThumbnailUrl(photo.thumbnailUrl)
            : getGalleryThumbnailUrl(photo.url)
          
          return (
            <div key={photo.id} className="relative group">
              <MediaCard
                src={thumbnailUrl}
                alt={photo.caption || 'Event media'}
                description={photo.caption}
                onClick={() => handlePhotoClick(photo)}
                aspectRatio="square"
                loading={index < 12 ? 'eager' : 'lazy'}
              />
              {/* Play icon overlay for videos */}
              {isVideo(photo) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="bg-black bg-opacity-50 rounded-full p-4 group-hover:bg-opacity-70 transition-opacity">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-full w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ✕
            </button>
            {isVideo(selectedPhoto) ? (
              <div className="relative w-full aspect-video">
                <video
                  src={selectedPhoto.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <Image
                src={getOptimizedImageUrl(selectedPhoto.url, 1200)}
                alt={selectedPhoto.caption || 'Event photo'}
                width={1200}
                height={800}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                quality={90}
                priority
              />
            )}
            {(selectedPhoto.caption || selectedPhoto.uploadedBy) && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b-lg">
                {selectedPhoto.caption && <p>{selectedPhoto.caption}</p>}
                {selectedPhoto.uploadedBy && (
                  <p className="text-sm text-gray-300 mt-1">
                    By {selectedPhoto.uploadedBy}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

