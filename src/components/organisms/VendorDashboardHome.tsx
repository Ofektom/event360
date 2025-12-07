'use client'

import { Card } from '@/components/atoms/Card'
import Link from 'next/link'
import Image from 'next/image'

interface VendorDashboardHomeProps {
  vendor: any
  stats: {
    totalEvents: number
    upcomingEvents: number
    completedEvents: number
    averageRating: number
    totalRatings: number
  }
}

export function VendorDashboardHome({ vendor, stats }: VendorDashboardHomeProps) {
  const upcomingEvents = vendor.eventVendors
    .filter((ev: any) => ev.event.startDate && new Date(ev.event.startDate) > new Date())
    .slice(0, 5)

  const recentRatings = vendor.ratings.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {vendor.ownerName || 'Vendor'}!</h1>
        <p className="text-gray-600 mt-1">{vendor.businessName}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEvents}</p>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.upcomingEvents}</p>
            </div>
            <div className="text-3xl">⏰</div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completedEvents}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalRatings} reviews</p>
            </div>
            <div className="text-3xl">⭐</div>
          </div>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card variant="elevated" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
          <Link
            href="/vendor/events"
            className="text-sm text-purple-600 hover:underline font-medium"
          >
            View all
          </Link>
        </div>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map((eventVendor: any) => {
              const event = eventVendor.event
              const eventDate = event.startDate ? new Date(event.startDate) : null
              return (
                <div
                  key={eventVendor.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                        {eventDate && (
                          <span>📅 {eventDate.toLocaleDateString()}</span>
                        )}
                        {event.location && (
                          <span>📍 {event.location}</span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          event.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                          event.status === 'LIVE' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/vendor/events/${event.id}`}
                      className="ml-4 text-purple-600 hover:underline text-sm font-medium"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No upcoming events</p>
        )}
      </Card>

      {/* Recent Ratings */}
      {recentRatings.length > 0 && (
        <Card variant="elevated" padding="md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Ratings</h2>
          <div className="space-y-4">
            {recentRatings.map((rating: any) => (
              <div key={rating.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                <div className="flex items-start gap-3">
                  {rating.user.image ? (
                    <Image
                      src={rating.user.image}
                      alt={rating.user.name || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {(rating.user.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {rating.user.name || 'Anonymous'}
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={i < rating.rating ? 'text-yellow-400' : 'text-gray-300'}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    {rating.event && (
                      <p className="text-sm text-gray-600 mt-1">Event: {rating.event.title}</p>
                    )}
                    {rating.review && (
                      <p className="text-sm text-gray-700 mt-2">{rating.review}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Profile Completeness */}
      <Card variant="elevated" padding="md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Completeness</h2>
        <div className="space-y-3">
          {!vendor.logo && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>⚠️</span>
              <span>Add a logo to your profile</span>
              <Link href="/vendor/profile" className="text-purple-600 hover:underline ml-auto">
                Update →
              </Link>
            </div>
          )}
          {!vendor.description && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>⚠️</span>
              <span>Add a business description</span>
              <Link href="/vendor/profile" className="text-purple-600 hover:underline ml-auto">
                Update →
              </Link>
            </div>
          )}
          {(!vendor.portfolio || (Array.isArray(vendor.portfolio) && vendor.portfolio.length === 0)) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>⚠️</span>
              <span>Add portfolio images</span>
              <Link href="/vendor/profile" className="text-purple-600 hover:underline ml-auto">
                Update →
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

