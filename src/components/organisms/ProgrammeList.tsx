'use client'

import { Card } from '@/components/atoms/Card'

interface ProgrammeItem {
  id: string
  title: string
  description?: string
  startTime: Date | string
  endTime?: Date | string
  location?: string
  type?: string
  order: number
}

interface ProgrammeListProps {
  items: ProgrammeItem[]
  variant?: 'timeline' | 'cards' | 'list'
}

export function ProgrammeList({ items, variant = 'timeline' }: ProgrammeListProps) {
  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  if (variant === 'timeline') {
    return (
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[var(--theme-primary)] opacity-20"></div>

        <div className="space-y-8">
          {items.map((item, index) => (
            <div key={item.id} className="relative flex gap-6">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[var(--theme-primary)] flex items-center justify-center text-white font-bold text-lg">
                  {index + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <Card variant="elevated" padding="md">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      {item.type && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-[var(--theme-accent)] text-[var(--theme-primary)] rounded">
                          {item.type}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[var(--theme-primary)]">
                        {formatTime(item.startTime)}
                      </p>
                      {item.endTime && (
                        <p className="text-xs text-gray-500">
                          - {formatTime(item.endTime)}
                        </p>
                      )}
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-gray-600 mb-3">{item.description}</p>
                  )}
                  {item.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>📍</span>
                      <span>{item.location}</span>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Cards variant
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((item) => (
        <Card key={item.id} variant="elevated" padding="md">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            <span className="text-sm font-medium text-[var(--theme-primary)]">
              {formatTime(item.startTime)}
            </span>
          </div>
          {item.description && (
            <p className="text-gray-600 text-sm mb-2">{item.description}</p>
          )}
          {item.location && (
            <p className="text-xs text-gray-500">📍 {item.location}</p>
          )}
        </Card>
      ))}
    </div>
  )
}

