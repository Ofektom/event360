import { NextRequest, NextResponse } from 'next/server'
import { EventService } from '@/services/event.service'
import { CreateEventDto, GetEventsFilters } from '@/types/event.types'
import { EventType } from '@/types/enums'
import { requireAuth } from '@/lib/auth'

const eventService = new EventService()

// GET /api/events - Get all events for a user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const familyId = searchParams.get('familyId')

    const filters: GetEventsFilters = {
      ownerId: user.id,
    }
    if (familyId) {
      filters.familyId = familyId
    }

    const events = await eventService.getEvents(filters)
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (error instanceof Error && error.message === 'User ID is required') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const eventData: CreateEventDto = {
      title: body.title,
      description: body.description,
      type: body.type || EventType.CELEBRATION,
      ownerId: user.id,
      familyId: body.familyId,
      themeId: body.themeId,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      location: body.location,
      timezone: body.timezone || 'UTC',
      customTheme: body.customTheme,
    }

    const event = await eventService.createEvent(eventData)
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

