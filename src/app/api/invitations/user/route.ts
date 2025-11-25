import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/invitations/user - Get all invitation designs for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Get all events owned by the user
    const events = await prisma.event.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    })

    const eventIds = events.map((e) => e.id)

    if (eventIds.length === 0) {
      return NextResponse.json([])
    }

    // Get all invitation designs for user's events
    const designs = await prisma.invitationDesign.findMany({
      where: {
        eventId: { in: eventIds },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            preview: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(designs)
  } catch (error) {
    console.error('Error fetching user invitations:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

