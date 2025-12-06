import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/reels - Get all videos/reels for the current user, categorized by events and dates
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Get all videos (VIDEO type) for events the user is linked to
    // User can be owner or invitee
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

    if (eventIds.length === 0) {
      return NextResponse.json({ reels: [], categorized: {} })
    }

    // Fetch all videos
    const reels = await prisma.mediaAsset.findMany({
      where: {
        eventId: { in: eventIds },
        type: 'VIDEO',
        isApproved: true,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            startDate: true,
            endDate: true,
          },
        },
        ceremony: {
          select: {
            id: true,
            name: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Categorize videos by event
    const byEvent: Record<string, any[]> = {}
    // Categorize videos by date (group by month/year)
    const byDate: Record<string, any[]> = {}

    reels.forEach((reel) => {
      const eventId = reel.eventId
      const eventTitle = reel.event.title

      // Group by event
      if (!byEvent[eventId]) {
        byEvent[eventId] = {
          event: {
            id: reel.event.id,
            title: eventTitle,
            slug: reel.event.slug,
            type: reel.event.type,
          },
          reels: [],
        }
      }
      byEvent[eventId].reels.push({
        id: reel.id,
        url: reel.url,
        thumbnailUrl: reel.thumbnailUrl,
        caption: reel.caption,
        duration: reel.duration,
        createdAt: reel.createdAt.toISOString(),
        ceremony: reel.ceremony,
        uploadedBy: reel.uploadedBy,
        likeCount: reel.likeCount,
        viewCount: reel.viewCount,
      })

      // Group by date (month/year)
      const date = new Date(reel.createdAt)
      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
      if (!byDate[dateKey]) {
        byDate[dateKey] = []
      }
      byDate[dateKey].push({
        id: reel.id,
        url: reel.url,
        thumbnailUrl: reel.thumbnailUrl,
        caption: reel.caption,
        duration: reel.duration,
        createdAt: reel.createdAt.toISOString(),
        event: {
          id: reel.event.id,
          title: eventTitle,
          slug: reel.event.slug,
        },
        ceremony: reel.ceremony,
        uploadedBy: reel.uploadedBy,
        likeCount: reel.likeCount,
        viewCount: reel.viewCount,
      })
    })

    return NextResponse.json({
      reels,
      categorized: {
        byEvent: Object.values(byEvent),
        byDate: Object.entries(byDate)
          .sort(([a], [b]) => {
            // Sort dates descending (newest first)
            return new Date(b).getTime() - new Date(a).getTime()
          })
          .map(([date, reels]) => ({ date, reels })),
      },
    })
  } catch (error: any) {
    console.error('Error fetching reels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reels', details: error.message },
      { status: 500 }
    )
  }
}

