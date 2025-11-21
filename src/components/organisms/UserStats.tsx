'use client'

import { Card } from '@/components/atoms/Card'

interface Stats {
  eventsCreated: number
  eventsInvited: number
  mediaUploaded: number
  interactionsMade: number
}

interface UserStatsProps {
  stats: Stats
}

export function UserStats({ stats }: UserStatsProps) {
  const statItems = [
    {
      label: 'Events Created',
      value: stats.eventsCreated,
      icon: '🎉',
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Events Invited',
      value: stats.eventsInvited,
      icon: '📅',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Media Uploaded',
      value: stats.mediaUploaded,
      icon: '📸',
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Interactions',
      value: stats.interactionsMade,
      icon: '💬',
      color: 'from-orange-500 to-red-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((stat, index) => (
        <Card key={index} className="p-6 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${stat.color} mb-4 text-3xl`}>
            {stat.icon}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stat.value}
          </div>
          <div className="text-sm text-gray-600">{stat.label}</div>
        </Card>
      ))}
    </div>
  )
}

