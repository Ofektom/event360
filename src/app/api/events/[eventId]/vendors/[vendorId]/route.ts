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

    // Remove vendor from event
    await prisma.eventVendor.delete({
      where: {
        eventId_vendorId: {
          eventId,
          vendorId,
        },
      },
    })

    return NextResponse.json({ message: 'Vendor removed from event' })
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

// PATCH /api/events/[eventId]/vendors/[vendorId] - Update vendor details for event
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; vendorId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId, vendorId } = await params
    const body = await request.json()

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

    // Update event vendor
    const eventVendor = await prisma.eventVendor.update({
      where: {
        eventId_vendorId: {
          eventId,
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

