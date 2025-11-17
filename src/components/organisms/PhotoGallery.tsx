'use client'

import { useState } from 'react'
import { MediaCard } from '@/components/molecules/MediaCard'
import Image from 'next/image'

interface Photo {
  id: string
  url: string
  thumbnailUrl?: string
  caption?: string
  uploadedBy?: string
  timestamp?: Date | string
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

  return (
    <>
      <div className={`grid ${columnClasses[columns]} gap-4`}>
        {photos.map((photo) => (
          <MediaCard
            key={photo.id}
            src={photo.thumbnailUrl || photo.url}
            alt={photo.caption || 'Event photo'}
            description={photo.caption}
            onClick={() => handlePhotoClick(photo)}
            aspectRatio="square"
          />
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-gray-300"
            >
              ✕
            </button>
            <Image
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Event photo'}
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            {selectedPhoto.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b-lg">
                <p>{selectedPhoto.caption}</p>
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

