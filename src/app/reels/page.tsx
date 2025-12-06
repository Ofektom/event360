'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import Image from 'next/image'
import Link from 'next/link'

interface Reel {
  id: string
  url: string
  thumbnailUrl: string | null
  caption: string | null
  duration: number | null
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
  reels: Reel[]
}

interface DateGroup {
  date: string
  reels: Reel[]
}

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([])
  const [byEvent, setByEvent] = useState<EventGroup[]>([])
  const [byDate, setByDate] = useState<DateGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'events' | 'dates'>('all')
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null)

  useEffect(() => {
    fetchReels()
  }, [])

  const fetchReels = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/reels')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reels')
      }

      setReels(data.reels || [])
      setByEvent(data.categorized?.byEvent || [])
      setByDate(data.categorized?.byDate || [])
    } catch (err: any) {
      console.error('Error fetching reels:', err)
      setError(err.message || 'Failed to load reels')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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

  const renderReelGrid = (reelList: Reel[]) => {
    if (reelList.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p>No videos found</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {reelList.map((reel) => (
          <div
            key={reel.id}
            className="relative aspect-[9/16] rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity group"
            onClick={() => setSelectedReel(reel)}
          >
            {reel.thumbnailUrl ? (
              <Image
                src={reel.thumbnailUrl}
                alt={reel.caption || 'Video'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-90 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {/* Duration badge */}
            {reel.duration && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {formatDuration(reel.duration)}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reels</h1>
            <p className="text-gray-600 mt-1">
              {reels.length} {reels.length === 1 ? 'video' : 'videos'}
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
            All Videos
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
          <div>{renderReelGrid(reels)}</div>
        )}

        {viewMode === 'events' && (
          <div className="space-y-8">
            {byEvent.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No videos organized by events</p>
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
                        {group.reels.length} {group.reels.length === 1 ? 'video' : 'videos'}
                      </p>
                    </div>
                  </div>
                  {renderReelGrid(group.reels)}
                </div>
              ))
            )}
          </div>
        )}

        {viewMode === 'dates' && (
          <div className="space-y-8">
            {byDate.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No videos organized by date</p>
              </div>
            ) : (
              byDate.map((group) => (
                <div key={group.date} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{group.date}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {group.reels.length} {group.reels.length === 1 ? 'video' : 'videos'}
                    </p>
                  </div>
                  {renderReelGrid(group.reels)}
                </div>
              ))
            )}
          </div>
        )}

        {/* Video Modal */}
        {selectedReel && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedReel(null)}
          >
            <div className="relative max-w-4xl max-h-full w-full">
              <button
                onClick={() => setSelectedReel(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <video
                src={selectedReel.url}
                controls
                autoPlay
                className="w-full max-h-[90vh]"
                poster={selectedReel.thumbnailUrl || undefined}
              >
                Your browser does not support the video tag.
              </video>
              {selectedReel.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4">
                  <p>{selectedReel.caption}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

