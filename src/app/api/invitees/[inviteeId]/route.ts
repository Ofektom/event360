import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { InviteeService } from '@/services/invitee.service'
import { UpdateInviteeDto } from '@/types/invitee.types'
import { prisma } from '@/lib/prisma'

const inviteeService = new InviteeService()

// GET /api/invitees/[inviteeId] - Get a specific invitee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteeId: string }> }
) {
  try {
    await requireAuth()
    const { inviteeId } = await params

    const invitee = await inviteeService.getInviteeById(inviteeId)
    return NextResponse.json(invitee)
  } catch (error: any) {
    console.error('Error fetching invitee:', error)

    if (error.message === 'Invitee not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch invitee' },
      { status: 500 }
    )
  }
}

// PATCH /api/invitees/[inviteeId] - Update an invitee
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ inviteeId: string }> }
) {
  try {
    const user = await requireAuth()
    const { inviteeId } = await params
    const body = await request.json()

    // Verify user has access to this invitee (must own the event)
    const invitee = await prisma.invitee.findUnique({
      where: { id: inviteeId },
      include: {
        event: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!invitee) {
      return NextResponse.json(
        { error: 'Invitee not found' },
        { status: 404 }
      )
    }

    if (invitee.event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const updateData: UpdateInviteeDto = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      group: body.group,
      rsvpStatus: body.rsvpStatus,
      rsvpNotes: body.rsvpNotes,
      notificationChannels: body.notificationChannels,
    }

    const updatedInvitee = await inviteeService.updateInvitee(inviteeId, updateData)
    return NextResponse.json(updatedInvitee)
  } catch (error: any) {
    console.error('Error updating invitee:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error.message === 'Invitee not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update invitee' },
      { status: 500 }
    )
  }
}

// DELETE /api/invitees/[inviteeId] - Delete an invitee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ inviteeId: string }> }
) {
  try {
    const user = await requireAuth()
    const { inviteeId } = await params

    // Verify user has access to this invitee (must own the event)
    const invitee = await prisma.invitee.findUnique({
      where: { id: inviteeId },
      include: {
        event: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!invitee) {
      return NextResponse.json(
        { error: 'Invitee not found' },
        { status: 404 }
      )
    }

    if (invitee.event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await inviteeService.deleteInvitee(inviteeId)
    return NextResponse.json({ message: 'Invitee deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting invitee:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error.message === 'Invitee not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete invitee' },
      { status: 500 }
    )
  }
}

