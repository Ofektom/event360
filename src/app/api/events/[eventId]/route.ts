import { NextRequest, NextResponse } from 'next/server'
import { EventService } from '@/services/event.service'
import { UpdateEventDto } from '@/types/event.types'
import { requireAuth } from '@/lib/auth'

const eventService = new EventService()

// GET /api/events/[eventId] - Get a specific event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const event = await eventService.getEventById(eventId)
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
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId } = await params
    
    // Check if user owns the event
    const existingEvent = await eventService.getEventById(eventId)
    if (existingEvent.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
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
      visibility: body.visibility,
      allowGuestUploads: body.allowGuestUploads,
      allowComments: body.allowComments,
      allowReactions: body.allowReactions,
    }

    const updatedEvent = await eventService.updateEvent(eventId, updateData)
    return NextResponse.json(updatedEvent)
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
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId } = await params
    
    // Check if user owns the event
    const event = await eventService.getEventById(eventId)
    if (event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    await eventService.deleteEvent(eventId)
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

