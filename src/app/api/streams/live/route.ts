import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/streams/live - Get all currently live streams
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Get all events user is linked to (as owner or invitee)
    const ownedEvents = await prisma.event.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    })
    const invitedEvents = await prisma.invitee.findMany({
      where: { userId: user.id },
      select: { eventId: true },
    })

    const eventIds = [
      ...ownedEvents.map((e) => e.id),
      ...invitedEvents.map((e) => e.eventId),
    ]

    // Get all live streams from ceremonies in user's events
    const liveStreams = await prisma.ceremony.findMany({
      where: {
        eventId: { in: eventIds },
        isStreaming: true,
        streamUrl: { not: null },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            ownerId: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({
      streams: liveStreams.map((ceremony) => ({
        id: ceremony.id,
        name: ceremony.name,
        streamUrl: ceremony.streamUrl,
        event: {
          id: ceremony.event.id,
          title: ceremony.event.title,
          slug: ceremony.event.slug,
          type: ceremony.event.type,
        },
        updatedAt: ceremony.updatedAt.toISOString(),
      })),
    })
  } catch (error: any) {
    console.error('Error fetching live streams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live streams' },
      { status: 500 }
    )
  }
}

