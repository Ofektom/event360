import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/events/[eventId]/join
 * Add authenticated user as a guest to an event
 * Creates an invitee record if one doesn't exist, or links existing invitee to user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  
  try {
    const sessionUser = await requireAuth()

    // Fetch full user from database to get phone number
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if user is already an invitee for this event
    const existingInvitee = await prisma.invitee.findFirst({
      where: {
        eventId,
        userId: user.id,
      },
    })

    if (existingInvitee) {
      // User is already a guest
      return NextResponse.json({
        message: 'You are already a guest for this event',
        invitee: existingInvitee,
        alreadyGuest: true,
      })
    }

    // Check if there's an invitee record with matching email/phone that's not linked
    const matchingInvitee = await prisma.invitee.findFirst({
      where: {
        eventId,
        userId: null,
        OR: [
          { email: { equals: user.email, mode: 'insensitive' } },
          ...(user.phone ? [{ phone: user.phone }] : []),
        ],
      },
    })

    if (matchingInvitee) {
      // Link existing invitee to user
      const linkedInvitee = await prisma.invitee.update({
        where: { id: matchingInvitee.id },
        data: {
          userId: user.id,
          registeredAt: new Date(),
        },
      })

      return NextResponse.json({
        message: 'Successfully joined event',
        invitee: linkedInvitee,
        linked: true,
      })
    }

    // Create new invitee record for the user
    const newInvitee = await prisma.invitee.create({
      data: {
        eventId,
        userId: user.id,
        name: user.name || 'Guest',
        email: user.email,
        phone: user.phone || null,
        registeredAt: new Date(),
        rsvpStatus: 'PENDING',
      },
    })

    return NextResponse.json({
      message: 'Successfully joined event',
      invitee: newInvitee,
      created: true,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error joining event:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Handle unique constraint violations (user already guest via different email/phone)
    if (error.code === 'P2002') {
      // Try to find and return existing invitee
      try {
        const sessionUser = await requireAuth()
        const fullUser = await prisma.user.findUnique({
          where: { id: sessionUser.id },
          select: { id: true },
        })
        if (fullUser) {
          const existingInvitee = await prisma.invitee.findFirst({
            where: {
              eventId,
              userId: fullUser.id,
            },
          })
          if (existingInvitee) {
            return NextResponse.json({
              message: 'You are already a guest for this event',
              invitee: existingInvitee,
              alreadyGuest: true,
            })
          }
        }
      } catch {
        // Fall through to error response
      }
    }

    return NextResponse.json(
      { error: 'Failed to join event' },
      { status: 500 }
    )
  }
}

