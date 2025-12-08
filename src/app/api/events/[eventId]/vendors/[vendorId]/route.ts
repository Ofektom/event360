import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/events/[eventId]/vendors/[vendorId] - Remove vendor from event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; vendorId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId, vendorId } = await params

    // Verify user owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only remove vendors from your own events' },
        { status: 403 }
      )
    }

    // Get ceremonyId from query params or body
    const searchParams = request.nextUrl.searchParams
    const ceremonyId = searchParams.get('ceremonyId') || (await request.json().catch(() => ({}))).ceremonyId

    if (!ceremonyId) {
      return NextResponse.json(
        { error: 'Ceremony ID is required to remove vendor' },
        { status: 400 }
      )
    }

    // Verify ceremony belongs to this event
    const ceremony = await prisma.ceremony.findUnique({
      where: { id: ceremonyId },
      select: { id: true, eventId: true },
    })

    if (!ceremony || ceremony.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Ceremony not found or does not belong to this event' },
        { status: 404 }
      )
    }

    // Remove vendor from ceremony
    await prisma.eventVendor.delete({
      where: {
        eventId_ceremonyId_vendorId: {
          eventId,
          ceremonyId,
          vendorId,
        },
      },
    })

    return NextResponse.json({ message: 'Vendor removed from ceremony' })
  } catch (error: any) {
    console.error('Error removing vendor from event:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to remove vendor from event' },
      { status: 500 }
    )
  }
}

// PATCH /api/events/[eventId]/vendors/[vendorId] - Update vendor details for ceremony
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; vendorId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId, vendorId } = await params
    const body = await request.json()

    // Require ceremonyId
    if (!body.ceremonyId) {
      return NextResponse.json(
        { error: 'Ceremony ID is required' },
        { status: 400 }
      )
    }

    // Verify user owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only update vendors in your own events' },
        { status: 403 }
      )
    }

    // Verify ceremony belongs to this event
    const ceremony = await prisma.ceremony.findUnique({
      where: { id: body.ceremonyId },
      select: { id: true, eventId: true },
    })

    if (!ceremony || ceremony.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Ceremony not found or does not belong to this event' },
        { status: 404 }
      )
    }

    // Update event vendor
    const eventVendor = await prisma.eventVendor.update({
      where: {
        eventId_ceremonyId_vendorId: {
          eventId,
          ceremonyId: body.ceremonyId,
          vendorId,
        },
      },
      data: {
        role: body.role !== undefined ? body.role : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        status: body.status !== undefined ? body.status : undefined,
      },
      include: {
        vendor: {
          select: {
            id: true,
            ownerName: true,
            businessName: true,
            category: true,
            description: true,
            email: true,
            phone: true,
            whatsapp: true,
            website: true,
            city: true,
            state: true,
            logo: true,
            isVerified: true,
            averageRating: true,
            totalRatings: true,
          },
        },
      },
    })

    return NextResponse.json(eventVendor)
  } catch (error: any) {
    console.error('Error updating event vendor:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    )
  }
}

