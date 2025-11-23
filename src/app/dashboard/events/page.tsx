import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { EventsList } from '@/components/organisms/EventsList'
import Link from 'next/link'
import { EventService } from '@/services/event.service'
import { prisma } from '@/lib/prisma'

const eventService = new EventService()

export default async function EventsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  try {
    // Fetch user's events
    let events: any[] = []
    try {
      events = await eventService.getEvents({ ownerId: user.id })
    } catch (error: any) {
      console.error('Error fetching events via service:', error)
      // Fallback: query directly with Prisma
      try {
        // Try with ceremonies orderBy first, using select to avoid visibility column
        try {
          events = await prisma.event.findMany({
            where: { ownerId: user.id },
            select: {
              id: true,
              title: true,
              description: true,
              slug: true,
              type: true,
              status: true,
              ownerId: true,
              startDate: true,
              endDate: true,
              location: true,
              createdAt: true,
              updatedAt: true,
              theme: true,
              ceremonies: {
                orderBy: { order: 'asc' },
              },
              _count: {
                select: {
                  invitees: true,
                  mediaAssets: true,
                  ceremonies: true,
                  interactions: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        } catch (orderError: any) {
          // If orderBy or visibility fails, try without orderBy
          if (orderError?.code === 'P2022' || orderError?.message?.includes('visibility') || orderError?.message?.includes('order') || orderError?.message?.includes('Unknown column')) {
            console.log('Query failed, trying without problematic fields')
            events = await prisma.event.findMany({
              where: { ownerId: user.id },
              select: {
                id: true,
                title: true,
                description: true,
                slug: true,
                type: true,
                status: true,
                ownerId: true,
                startDate: true,
                endDate: true,
                location: true,
                createdAt: true,
                updatedAt: true,
                theme: true,
                ceremonies: true, // Without orderBy
                _count: {
                  select: {
                    invitees: true,
                    mediaAssets: true,
                    ceremonies: true,
                    interactions: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            })
          } else {
            throw orderError
          }
        }
      } catch (fallbackError: any) {
        console.error('Fallback query also failed:', fallbackError)
        throw new Error(`Failed to load events: ${fallbackError?.message || 'Unknown error'}`)
      }
    }

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
  } catch (error: any) {
    console.error('Error loading events:', error)
    // Log detailed error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Events error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
    }
    return (
      <DashboardLayout>
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Events</h1>
          <p className="text-gray-600 mb-4">
            {process.env.NODE_ENV === 'development' 
              ? error.message || 'Failed to load your events. Please try again later.'
              : 'Failed to load your events. Please try again later.'}
          </p>
          <Link href="/dashboard/events">
            <Button variant="outline">Retry</Button>
          </Link>
        </Card>
      </DashboardLayout>
    )
  }
}

