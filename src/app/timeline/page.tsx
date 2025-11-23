import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TimelineFeed } from '@/components/organisms/TimelineFeed'

export default async function TimelinePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Timeline</h1>
            <p className="text-gray-600 mt-2">
              See posts and updates from events you're part of
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/events">
              <Button variant="outline">Manage Events</Button>
            </Link>
            <Link href="/events/new">
              <Button variant="primary">Create Event</Button>
            </Link>
          </div>
        </div>

        {/* Timeline Feed */}
        <TimelineFeed />
      </div>
    </DashboardLayout>
  )
}

