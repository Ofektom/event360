'use client'

import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import Link from 'next/link'

interface JoinEventBannerProps {
  eventSlug: string
  eventId?: string
}

export function JoinEventBanner({ eventSlug, eventId }: JoinEventBannerProps) {
  const callbackUrl = `/e/${eventSlug}`
  const signupUrl = eventId 
    ? `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}&eventId=${eventId}`
    : `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
  const signinUrl = eventId
    ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&eventId=${eventId}`
    : `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`

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
            <Link href={signupUrl}>
              <Button variant="primary">Sign Up</Button>
            </Link>
            <Link href={signinUrl}>
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}


