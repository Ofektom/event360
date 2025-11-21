import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { linkUserToInvitees, linkUserToInvitee } from '@/lib/invitee-linking'
import { prisma } from '@/lib/prisma'

// POST /api/invitees/link - Link user to invitee(s)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { eventId, inviteeId } = body

    // If inviteeId is provided, link to specific invitee
    if (inviteeId) {
      const invitee = await linkUserToInvitee(user.id, inviteeId)
      return NextResponse.json({
        message: 'Successfully linked to invitee',
        invitee,
      })
    }

    // If eventId is provided, try to find and link invitee for this event
    if (eventId) {
      // Find invitee for this event matching user's email/phone
      const invitee = await prisma.invitee.findFirst({
        where: {
          eventId,
          userId: null,
          OR: [
            { email: { equals: user.email, mode: 'insensitive' } },
            ...(user.phone ? [{ phone: user.phone }] : []),
          ],
        },
      })

      if (invitee) {
        const linked = await linkUserToInvitee(user.id, invitee.id)
        return NextResponse.json({
          message: 'Successfully linked to event',
          invitee: linked,
        })
      } else {
        return NextResponse.json(
          {
            error: 'No matching invitee found for this event. Please contact the event organizer.',
          },
          { status: 404 }
        )
      }
    }

    // Otherwise, try to auto-link all matching invitees
    const result = await linkUserToInvitees(user.id, user.email, user.phone || undefined)

    return NextResponse.json({
      message: `Successfully linked to ${result.linked} invitee(s)`,
      linked: result.linked,
      invitees: result.invitees,
    })
  } catch (error: any) {
    console.error('Error linking invitee:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: error.message || 'Failed to link invitee' },
      { status: 500 }
    )
  }
}
