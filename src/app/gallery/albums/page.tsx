'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { BackButton } from '@/components/shared/BackButton'
import Link from 'next/link'
import Image from 'next/image'

interface Album {
  id: string
  name: string
  description: string | null
  coverPhotoUrl: string | null
  photoCount: number
  event: {
    id: string
    title: string
  }
}

export default function PhotoAlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/media/albums')
        if (!response.ok) throw new Error('Failed to fetch albums')
        const data = await response.json()
        setAlbums(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load albums')
      } finally {
        setLoading(false)
      }
    }

    fetchAlbums()
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
        <div className="flex items-center justify-between">
          <div>
            <BackButton href="/gallery" />
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Photo Albums</h1>
          </div>
          <Button variant="primary">
            Create Album
          </Button>
        </div>
        
        {albums.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 mb-4">No albums created yet.</p>
            <Button variant="primary">
              Create Your First Album
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <Link key={album.id} href={`/gallery/albums/${album.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  {album.coverPhotoUrl ? (
                    <div className="relative h-48 w-full">
                      <Image
                        src={album.coverPhotoUrl}
                        alt={album.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {album.name}
                    </h3>
                    {album.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {album.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

