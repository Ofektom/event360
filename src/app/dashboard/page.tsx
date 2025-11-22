import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.name || user.email}!
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your events and celebrations
            </p>
          </div>
          <Link href="/events/new">
            <Button variant="primary">Create Event</Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">My Events</h2>
            <p className="text-gray-600 mb-4">
              View and manage all your events
            </p>
            <Link href="/dashboard/events">
              <Button variant="outline" size="sm">
                View Events
              </Button>
            </Link>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">Create Event</h2>
            <p className="text-gray-600 mb-4">
              Start planning a new celebration
            </p>
            <Link href="/events/new">
              <Button variant="outline" size="sm">
                Create New
              </Button>
            </Link>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">Profile</h2>
            <p className="text-gray-600 mb-4">
              View and manage your profile
            </p>
            <Link href="/profile">
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

