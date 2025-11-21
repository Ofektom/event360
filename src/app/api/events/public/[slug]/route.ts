import { NextRequest, NextResponse } from 'next/server'
import { EventService } from '@/services/event.service'
import { canAccessEvent } from '@/lib/access-control'
import { getCurrentUser } from '@/lib/auth'

const eventService = new EventService()

// GET /api/events/public/[slug] - Get public event data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const user = await getCurrentUser()

    // Get event by slug
    const event = await eventService.getEventBySlug(slug)

    // Check access
    const access = await canAccessEvent(user?.id || null, event.id)

    if (!access.canView) {
      return NextResponse.json(
        { error: 'Event not found or not accessible' },
        { status: 404 }
      )
    }

    // Return event data with access information
    return NextResponse.json({
      event,
      access: {
        canView: access.canView,
        canInteract: access.canInteract,
        isOrganizer: access.isOrganizer,
        invitee: access.invitee,
      },
    })
  } catch (error: any) {
    console.error('Error fetching public event:', error)

    if (error.message === 'Event not found') {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}


