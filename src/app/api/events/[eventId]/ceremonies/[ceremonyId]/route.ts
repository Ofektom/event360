import { NextRequest, NextResponse } from 'next/server'
import { CeremonyService } from '@/services/ceremony.service'
import { UpdateCeremonyDto } from '@/types/ceremony.types'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

const ceremonyService = new CeremonyService()

// GET /api/events/[eventId]/ceremonies/[ceremonyId] - Get a single ceremony
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; ceremonyId: string }> }
) {
  try {
    const { eventId, ceremonyId } = await params
    
    // Verify ceremony exists and belongs to the event
    const ceremony = await prisma.ceremony.findUnique({
      where: { id: ceremonyId },
      include: {
        event: {
          select: { id: true, ownerId: true },
        },
      },
    })

    if (!ceremony) {
      return NextResponse.json(
        { error: 'Ceremony not found' },
        { status: 404 }
      )
    }

    // Verify ceremony belongs to the event
    if (ceremony.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Ceremony does not belong to this event' },
        { status: 400 }
      )
    }

    // Get full ceremony details using the service
    const ceremonyData = await ceremonyService.getCeremonyById(ceremonyId)
    return NextResponse.json(ceremonyData)
  } catch (error: any) {
    console.error('Error fetching ceremony:', error)
    
    if (error.message === 'Ceremony not found') {
      return NextResponse.json(
        { error: 'Ceremony not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch ceremony' },
      { status: 500 }
    )
  }
}

// PATCH /api/events/[eventId]/ceremonies/[ceremonyId] - Update a ceremony
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; ceremonyId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId, ceremonyId } = await params
    const body = await request.json()

    // Verify user owns the event
    const ceremony = await prisma.ceremony.findUnique({
      where: { id: ceremonyId },
      include: {
        event: {
          select: { ownerId: true },
        },
      },
    })

    if (!ceremony) {
      return NextResponse.json(
        { error: 'Ceremony not found' },
        { status: 404 }
      )
    }

    if (ceremony.event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Only event owner can update ceremonies.' },
        { status: 403 }
      )
    }

    // Verify ceremony belongs to the event
    if (ceremony.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Ceremony does not belong to this event' },
        { status: 400 }
      )
    }

    const updateData: UpdateCeremonyDto = {
      name: body.name,
      description: body.description,
      order: body.order,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location,
      venue: body.venue,
      dressCode: body.dressCode,
      notes: body.notes,
      streamUrl: body.streamUrl,
      streamKey: body.streamKey,
      isStreaming: body.isStreaming,
    }

    const updated = await ceremonyService.updateCeremony(ceremonyId, updateData)
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating ceremony:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error.message === 'Ceremony not found') {
      return NextResponse.json(
        { error: 'Ceremony not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update ceremony' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[eventId]/ceremonies/[ceremonyId] - Delete a ceremony
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; ceremonyId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId, ceremonyId } = await params

    // Verify user owns the event
    const ceremony = await prisma.ceremony.findUnique({
      where: { id: ceremonyId },
      include: {
        event: {
          select: { ownerId: true },
        },
      },
    })

    if (!ceremony) {
      return NextResponse.json(
        { error: 'Ceremony not found' },
        { status: 404 }
      )
    }

    if (ceremony.event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Only event owner can delete ceremonies.' },
        { status: 403 }
      )
    }

    // Verify ceremony belongs to the event
    if (ceremony.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Ceremony does not belong to this event' },
        { status: 400 }
      )
    }

    await ceremonyService.deleteCeremony(ceremonyId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting ceremony:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error.message === 'Ceremony not found') {
      return NextResponse.json(
        { error: 'Ceremony not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete ceremony' },
      { status: 500 }
    )
  }
}

