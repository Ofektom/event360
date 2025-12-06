'use client'

import { Card } from '@/components/atoms/Card'
import Link from 'next/link'
import Image from 'next/image'

interface MediaItem {
  id: string
  url: string
  thumbnailUrl: string | null
  type: string
  caption: string | null
}

interface EventCardProps {
  event: {
    id: string
    type: 'event'
    author: {
      id: string | null
      name: string
      avatar: string | null
    }
    content: string | null
    event: {
      id: string
      title: string
      slug: string | null
      type: string
      hasProgramme?: boolean
      hasLiveStream?: boolean
      liveStreamUrl?: string | null
      isOwner?: boolean
    }
    timestamp: string
    eventDetails: {
      startDate: string | null
      endDate: string | null
      location: string | null
      mediaCount: number
      inviteeCount: number
    }
    media: MediaItem[]
  }
}

export function EventCard({ event }: EventCardProps) {
  const eventUrl = event.event.slug ? `/e/${event.event.slug}` : `/events/${event.event.id}`
  const displayMedia = event.media.slice(0, 6) // Show up to 6 media items in preview
  const remainingMediaCount = event.media.length - displayMedia.length

  return (
    <Link href={eventUrl}>
      <Card className="p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        {/* Event Header */}
        <div className="flex items-start gap-3 mb-4">
          {/* Event Avatar/Icon */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0">
            <span className="text-white font-semibold text-xl">
              {event.event.title.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              {event.event.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <time dateTime={event.timestamp}>
                {new Date(event.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            </div>
          </div>
        </div>

        {/* Event Description */}
        {event.content && (
          <p className="text-gray-700 mb-4 line-clamp-2">
            {event.content}
          </p>
        )}

        {/* Event Details Summary */}
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="space-y-2 text-sm">
            {event.eventDetails.startDate && (
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {new Date(event.eventDetails.startDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {event.eventDetails.endDate && 
                    ` - ${new Date(event.eventDetails.endDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}`
                  }
                </span>
              </div>
            )}
            {event.eventDetails.location && (
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{event.eventDetails.location}</span>
              </div>
            )}
            <div className="flex items-center gap-4 pt-1">
              <span className="flex items-center gap-1 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{event.eventDetails.mediaCount} photos</span>
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{event.eventDetails.inviteeCount} guests</span>
              </span>
            </div>
          </div>
        </div>

        {/* Media Grid - Show all media in a grid */}
        {event.media.length > 0 && (
          <div className="mb-4">
            {displayMedia.length === 1 ? (
              // Single media item - show large
              <div className="rounded-lg overflow-hidden bg-gray-100">
                {displayMedia[0].type === 'IMAGE' ? (
                  <div className="relative w-full aspect-video">
                    <Image
                      src={displayMedia[0].thumbnailUrl || displayMedia[0].url}
                      alt={displayMedia[0].caption || 'Event photo'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <video
                    src={displayMedia[0].url}
                    controls
                    className="w-full h-auto max-h-[400px]"
                    poster={displayMedia[0].thumbnailUrl || undefined}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : displayMedia.length === 2 ? (
              // Two media items - side by side
              <div className="grid grid-cols-2 gap-2">
                {displayMedia.map((item) => (
                  <div key={item.id} className="rounded-lg overflow-hidden bg-gray-100 aspect-square">
                    {item.type === 'IMAGE' ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={item.thumbnailUrl || item.url}
                          alt={item.caption || 'Event photo'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <video
                        src={item.url}
                        controls
                        className="w-full h-full object-cover"
                        poster={item.thumbnailUrl || undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ))}
              </div>
            ) : displayMedia.length === 3 ? (
              // Three media items - one large, two small
              <div className="grid grid-cols-2 gap-2">
                <div className="row-span-2 rounded-lg overflow-hidden bg-gray-100">
                  {displayMedia[0].type === 'IMAGE' ? (
                    <div className="relative w-full h-full aspect-square">
                      <Image
                        src={displayMedia[0].thumbnailUrl || displayMedia[0].url}
                        alt={displayMedia[0].caption || 'Event photo'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <video
                      src={displayMedia[0].url}
                      controls
                      className="w-full h-full object-cover"
                      poster={displayMedia[0].thumbnailUrl || undefined}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
                {displayMedia.slice(1).map((item) => (
                  <div key={item.id} className="rounded-lg overflow-hidden bg-gray-100 aspect-square">
                    {item.type === 'IMAGE' ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={item.thumbnailUrl || item.url}
                          alt={item.caption || 'Event photo'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <video
                        src={item.url}
                        controls
                        className="w-full h-full object-cover"
                        poster={item.thumbnailUrl || undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Four or more media items - grid layout
              <div className="grid grid-cols-3 gap-2">
                {displayMedia.slice(0, 5).map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`rounded-lg overflow-hidden bg-gray-100 aspect-square relative ${
                      index === 4 && remainingMediaCount > 0 ? 'bg-gray-800' : ''
                    }`}
                  >
                    {index === 4 && remainingMediaCount > 0 ? (
                      // Show "more" overlay
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
                        <span className="text-white font-bold text-lg">
                          +{remainingMediaCount + (event.media.length - 5)}
                        </span>
                      </div>
                    ) : item.type === 'IMAGE' ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={item.thumbnailUrl || item.url}
                          alt={item.caption || 'Event photo'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <video
                        src={item.url}
                        controls
                        className="w-full h-full object-cover"
                        poster={item.thumbnailUrl || undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View Event Link */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-center text-purple-600 hover:text-purple-700 font-medium text-sm">
            View Event Details
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Card>
    </Link>
  )
}


