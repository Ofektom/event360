'use client'

import { Card } from '@/components/atoms/Card'
import Image from 'next/image'

interface EventHeaderProps {
  title: string
  description?: string
  startDate?: Date | string
  endDate?: Date | string
  location?: string
  image?: string
  theme?: {
    primaryColor: string
    secondaryColor: string
  }
}

export function EventHeader({
  title,
  description,
  startDate,
  endDate,
  location,
  image,
  theme,
}: EventHeaderProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="relative">
      {/* Hero Image */}
      {image && (
        <div className="relative w-full h-96 md:h-[500px]">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, ${
                theme?.primaryColor || 'rgba(0,0,0,0.7)'
              } 100%)`,
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className={`w-full ${image ? '-mt-20 relative z-10' : ''}`}>
        <Card
          variant="elevated"
          padding="lg"
          className={image ? "bg-white/95 backdrop-blur-sm" : "bg-white"}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          {description && (
            <p className="text-lg text-gray-600 mb-6">{description}</p>
          )}

          <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            {startDate && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Date</p>
                <p className="text-gray-900">
                  {formatDate(startDate)}
                  {endDate && ` - ${formatDate(endDate)}`}
                </p>
              </div>
            )}
            {location && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                <p className="text-gray-900">📍 {location}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

