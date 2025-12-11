import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationChannel } from '@prisma/client'

/**
 * GET /api/invitees/[inviteeId]/notification-preferences
 * Get invitee's notification preferences
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteeId: string }> }
) {
  try {
    const user = await requireAuth()
    const { inviteeId } = await params

    const invitee = await prisma.invitee.findUnique({
      where: { id: inviteeId },
      select: {
        id: true,
        eventId: true,
        notificationChannels: true,
        whatsappChargesAccepted: true,
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

    // Check if user has permission (must be event owner or the invitee themselves)
    if (invitee.event.ownerId !== user.id && invitee.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      notificationChannels: invitee.notificationChannels || [NotificationChannel.EMAIL],
      whatsappChargesAccepted: invitee.whatsappChargesAccepted || false,
    })
  } catch (error: any) {
    console.error('Error fetching invitee notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/invitees/[inviteeId]/notification-preferences
 * Update invitee's notification preferences
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ inviteeId: string }> }
) {
  try {
    const user = await requireAuth()
    const { inviteeId } = await params
    const body = await request.json()

    const invitee = await prisma.invitee.findUnique({
      where: { id: inviteeId },
      select: {
        id: true,
        eventId: true,
        userId: true,
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

    // Check if user has permission (must be event owner or the invitee themselves)
    if (invitee.event.ownerId !== user.id && invitee.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { notificationChannels, whatsappChargesAccepted } = body

    // Validate notification channels
    if (notificationChannels && Array.isArray(notificationChannels)) {
      const validChannels = Object.values(NotificationChannel)
      const invalidChannels = notificationChannels.filter(
        (ch: string) => !validChannels.includes(ch as NotificationChannel)
      )

      if (invalidChannels.length > 0) {
        return NextResponse.json(
          { error: `Invalid notification channels: ${invalidChannels.join(', ')}` },
          { status: 400 }
        )
      }

      // Ensure at least one channel is selected
      if (notificationChannels.length === 0) {
        return NextResponse.json(
          { error: 'At least one notification channel must be selected' },
          { status: 400 }
        )
      }
    }

    // Update invitee preferences
    const updateData: any = {}
    if (notificationChannels !== undefined) {
      updateData.notificationChannels = notificationChannels
    }
    if (whatsappChargesAccepted !== undefined) {
      updateData.whatsappChargesAccepted = Boolean(whatsappChargesAccepted)
    }

    const updatedInvitee = await prisma.invitee.update({
      where: { id: inviteeId },
      data: updateData,
      select: {
        notificationChannels: true,
        whatsappChargesAccepted: true,
      },
    })

    return NextResponse.json({
      notificationChannels: updatedInvitee.notificationChannels,
      whatsappChargesAccepted: updatedInvitee.whatsappChargesAccepted,
    })
  } catch (error: any) {
    console.error('Error updating invitee notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}

