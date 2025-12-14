'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { BackButton } from '@/components/shared/BackButton'
import Link from 'next/link'
import Image from 'next/image'

interface Reel {
  id: string
  url: string
  thumbnailUrl: string | null
  caption: string | null
  duration: number | null
  createdAt: string
  likeCount: number
  viewCount: number
  event: {
    id: string
    title: string
  } | null
}

export default function MyReelsPage() {
  const { data: session } = useSession()
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMyReels = async () => {
      if (!session?.user?.id) return

      try {
        setLoading(true)
        const response = await fetch(`/api/reels?userId=${session.user.id}`)
        if (!response.ok) throw new Error('Failed to fetch reels')
        const data = await response.json()
        setReels(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load reels')
      } finally {
        setLoading(false)
      }
    }

    fetchMyReels()
  }, [session])

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
        <BackButton href="/reels" />
        <h1 className="text-3xl font-bold text-gray-900">My Reels</h1>
        
        {reels.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 mb-4">You haven't created any reels yet.</p>
            <Link href="/reels/new">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Create Your First Reel
              </button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reels.map((reel) => (
              <Link key={reel.id} href={`/reels/${reel.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  {reel.thumbnailUrl ? (
                    <div className="relative aspect-video w-full">
                      <Image
                        src={reel.thumbnailUrl}
                        alt={reel.caption || 'Reel thumbnail'}
                        fill
                        className="object-cover"
                      />
                      {reel.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          {Math.floor(reel.duration / 60)}:{(reel.duration % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    {reel.caption && (
                      <p className="text-sm text-gray-900 mb-2 line-clamp-2">
                        {reel.caption}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{reel.likeCount} likes</span>
                      <span>{reel.viewCount} views</span>
                    </div>
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

