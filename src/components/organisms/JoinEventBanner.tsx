'use client'

import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import Link from 'next/link'

interface JoinEventBannerProps {
  eventSlug: string
}

export function JoinEventBanner({ eventSlug }: JoinEventBannerProps) {
  return (
    <div className="container mx-auto px-4">
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Join this event to see more!
            </h3>
            <p className="text-gray-600">
              Sign up or sign in to view the timeline, photo gallery, live stream, and interact with other guests.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/auth/signup?callbackUrl=/e/${eventSlug}`}>
              <Button variant="primary">Sign Up</Button>
            </Link>
            <Link href={`/auth/signin?callbackUrl=/e/${eventSlug}`}>
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}


