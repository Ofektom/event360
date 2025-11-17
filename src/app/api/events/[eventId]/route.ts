import { NextRequest, NextResponse } from 'next/server'
import { EventService } from '@/services/event.service'
import { UpdateEventDto } from '@/types/event.types'

const eventService = new EventService()

// GET /api/events/[eventId] - Get a specific event
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = await eventService.getEventById(params.eventId)
    return NextResponse.json(event)
  } catch (error: any) {
    console.error('Error fetching event:', error)
    
    if (error.message === 'Event not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

// PATCH /api/events/[eventId] - Update an event
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await request.json()
    const updateData: UpdateEventDto = {
      title: body.title,
      description: body.description,
      type: body.type,
      status: body.status,
      themeId: body.themeId,
      startDate: body.startDate,
      endDate: body.endDate,
      location: body.location,
      timezone: body.timezone,
      customTheme: body.customTheme,
      isPublic: body.isPublic,
      allowGuestUploads: body.allowGuestUploads,
      allowComments: body.allowComments,
      allowReactions: body.allowReactions,
    }

    const event = await eventService.updateEvent(params.eventId, updateData)
    return NextResponse.json(event)
  } catch (error: any) {
    console.error('Error updating event:', error)
    
    if (error.message === 'Event not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[eventId] - Delete an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    await eventService.deleteEvent(params.eventId)
    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting event:', error)
    
    if (error.message === 'Event not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}

