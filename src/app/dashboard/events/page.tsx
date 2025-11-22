import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { EventsList } from '@/components/organisms/EventsList'
import Link from 'next/link'
import { EventService } from '@/services/event.service'

const eventService = new EventService()

export default async function EventsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  try {
    // Fetch user's events
    const events = await eventService.getEvents({ ownerId: user.id })

    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
              <p className="text-gray-600 mt-2">
                Manage all your events and celebrations
              </p>
            </div>
            <Link href="/events/new">
              <Button variant="primary">Create Event</Button>
            </Link>
          </div>

          {/* Events List */}
          <EventsList events={events} />
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error('Error loading events:', error)
    return (
      <DashboardLayout>
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Events</h1>
          <p className="text-gray-600">Failed to load your events. Please try again later.</p>
        </Card>
      </DashboardLayout>
    )
  }
}

