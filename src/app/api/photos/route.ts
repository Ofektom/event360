import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/photos - Get all photos for the current user, categorized by events and dates
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Get all photos (IMAGE type) for events the user is linked to
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
      return NextResponse.json({ photos: [], categorized: {} })
    }

    // Fetch all photos
    const photos = await prisma.mediaAsset.findMany({
      where: {
        eventId: { in: eventIds },
        type: 'IMAGE',
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

    // Categorize photos by event
    const byEvent: Record<string, { event: any; photos: any[] }> = {}
    // Categorize photos by date (group by month/year)
    const byDate: Record<string, any[]> = {}

    photos.forEach((photo) => {
      const eventId = photo.eventId
      const eventTitle = photo.event.title

      // Group by event
      if (!byEvent[eventId]) {
        byEvent[eventId] = {
          event: {
            id: photo.event.id,
            title: eventTitle,
            slug: photo.event.slug,
            type: photo.event.type,
          },
          photos: [],
        }
      }
      byEvent[eventId].photos.push({
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        caption: photo.caption,
        createdAt: photo.createdAt.toISOString(),
        ceremony: photo.ceremony,
        uploadedBy: photo.uploadedBy,
        likeCount: photo.likeCount,
        viewCount: photo.viewCount,
      })

      // Group by date (month/year)
      const date = new Date(photo.createdAt)
      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
      if (!byDate[dateKey]) {
        byDate[dateKey] = []
      }
      byDate[dateKey].push({
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        caption: photo.caption,
        createdAt: photo.createdAt.toISOString(),
        event: {
          id: photo.event.id,
          title: eventTitle,
          slug: photo.event.slug,
        },
        ceremony: photo.ceremony,
        uploadedBy: photo.uploadedBy,
        likeCount: photo.likeCount,
        viewCount: photo.viewCount,
      })
    })

    return NextResponse.json({
      photos,
      categorized: {
        byEvent: Object.values(byEvent),
        byDate: Object.entries(byDate)
          .sort(([a], [b]) => {
            // Sort dates descending (newest first)
            return new Date(b).getTime() - new Date(a).getTime()
          })
          .map(([date, photos]) => ({ date, photos })),
      },
    })
  } catch (error: any) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos', details: error.message },
      { status: 500 }
    )
  }
}

