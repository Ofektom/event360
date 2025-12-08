import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EventService } from '@/services/event.service'

const eventService = new EventService()

// GET /api/timeline - Get timeline posts from all events user is linked to
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Get all events user is linked to (as owner or invitee)
    // Use the same method as the events page
    let ownedEvents: any[] = []
    try {
      ownedEvents = await eventService.getEvents({ ownerId: user.id })
    } catch (error: any) {
      console.error('Error fetching owned events via service:', error)
      // Fallback: query directly with Prisma using select to avoid visibility field
      try {
        ownedEvents = await prisma.event.findMany({
          where: { ownerId: user.id },
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            status: true,
            createdAt: true,
            startDate: true,
            endDate: true,
            location: true,
            description: true,
            ownerId: true,
          },
        })
      } catch (fallbackError: any) {
        // Check if it's a visibility column error
        if (fallbackError?.code === 'P2022' || fallbackError?.message?.includes('visibility')) {
          console.log('Visibility column error in fallback, trying raw query')
          // Try with even more minimal select
          try {
            ownedEvents = await prisma.$queryRaw`
              SELECT id, title, slug, type, status, "createdAt", "startDate", "endDate", location, description, "ownerId"
              FROM "Event"
              WHERE "ownerId" = ${user.id}
              ORDER BY "createdAt" DESC
            `
          } catch (rawError: any) {
            console.error('Raw query also failed:', rawError)
            ownedEvents = []
          }
        } else {
          console.error('Fallback query failed:', fallbackError)
          ownedEvents = []
        }
      }
    }
    
    const invitedEvents = await prisma.invitee.findMany({
      where: { userId: user.id },
      select: { eventId: true },
    })

    const ownedEventIds = ownedEvents.map((e) => e.id)
    const invitedEventIds = invitedEvents.map((e) => e.eventId)

    // Get all events user can view based on visibility settings
    // PUBLIC: Anyone on the application
    // CONNECTED: Anyone connected to the user (for now, we'll use invited events + owned events)
    // INVITED_ONLY: Only invited guests
    // Note: visibility field might not exist yet if migration hasn't been run
    let publicEvents: { id: string }[] = []
    try {
      // Try to query public events - if visibility field doesn't exist, this will fail gracefully
      publicEvents = await prisma.event.findMany({
        where: {
          // @ts-ignore - visibility field might not exist yet
          visibility: 'PUBLIC',
          status: { in: ['PUBLISHED', 'LIVE'] },
          id: { notIn: [...ownedEventIds, ...invitedEventIds] },
        },
        select: { id: true },
      })
    } catch (error: any) {
      // If visibility field doesn't exist or query fails, skip public events query
      // This is expected if the migration hasn't been run yet
      if (error?.message?.includes('Unknown column') || error?.message?.includes('does not exist')) {
        console.log('Visibility field not available yet, skipping public events query')
      } else {
        console.error('Error querying public events:', error?.message)
      }
    }

    // Collect all event IDs user can view
    const eventIds = [
      ...ownedEventIds,
      ...invitedEventIds,
      ...publicEvents.map((e) => e.id),
    ]

    // Always show user's own events, even if no other posts exist
    // If user has created events, we should show them
    // IMPORTANT: Always include owned events, even if eventIds is empty
    const eventsToQuery = [...new Set([...ownedEventIds, ...eventIds])]

    if (eventsToQuery.length === 0) {
      return NextResponse.json({ events: [], posts: [] })
    }

    // Get full event details with ceremonies (programme)
    // Note: Invitations are private and not shown in timeline feed
    let eventsWithDetails: any[] = []
    try {
      eventsWithDetails = await prisma.event.findMany({
        where: { id: { in: eventsToQuery } },
        include: {
          ceremonies: {
            select: {
              id: true,
              name: true,
              streamUrl: true,
              isStreaming: true,
            },
          },
          _count: {
            select: {
              ceremonies: true, // Programme/order of events
            },
          },
        },
      })
    } catch (error: any) {
      console.error('Error fetching event details:', error)
      // Continue without event details - we'll use defaults
      eventsWithDetails = []
    }

    // Create a map of event details for quick lookup
    // Note: Invitations are private - not shown in timeline
    const eventDetailsMap = new Map(
      eventsWithDetails.map((event: any) => [
        event.id,
        {
          hasProgramme: (event._count?.ceremonies || 0) > 0, // Programme/order of events
          hasLiveStream: (event.ceremonies || []).some((c: any) => c?.isStreaming),
          liveStreamUrl: (event.ceremonies || []).find((c: any) => c?.isStreaming)?.streamUrl || null,
          isOwner: ownedEventIds.includes(event.id),
        },
      ])
    )

    // Fetch interactions (posts) from all linked events
    // Include comments, guestbook entries, and media posts
    let interactions: any[] = []
    try {
      interactions = await prisma.interaction.findMany({
      where: {
        eventId: { in: eventsToQuery },
        isApproved: true,
        OR: [
          { type: 'COMMENT' },
          { type: 'GUESTBOOK' },
          { type: 'BLESSING' },
          { type: 'WISH' },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            ownerId: true,
          },
        },
        mediaAsset: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            type: true,
            caption: true,
          },
        },
        ceremony: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent posts
      })
    } catch (error: any) {
      console.error('Error fetching interactions:', error)
      interactions = []
    }

    // Also fetch media assets as posts
    let mediaPosts: any[] = []
    try {
      mediaPosts = await prisma.mediaAsset.findMany({
      where: {
        eventId: { in: eventsToQuery },
        isApproved: true,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            ownerId: true,
          },
        },
        ceremony: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            interactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      })
    } catch (error: any) {
      console.error('Error fetching media posts:', error)
      mediaPosts = []
    }

    // Fetch events as posts (event creation posts)
    // Show published/live events for all users, and draft events only for owners
    let eventPosts: any[] = []
    try {
      // First, try to get all events the user owns or is invited to
      // Then filter by status
      const allUserEvents = await prisma.event.findMany({
        where: {
          id: { in: eventsToQuery },
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              mediaAssets: true,
              interactions: true,
              invitees: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      })
      
      // Filter events: show published/live for all, draft only for owner
      // IMPORTANT: Always show user's own events, regardless of status
      eventPosts = allUserEvents.filter((event: any) => {
        const status = event.status || 'DRAFT'
        const isOwner = event.ownerId === user.id
        
        // Always show owner's events
        if (isOwner) {
          return true
        }
        
        // Show published/live events for everyone
        if (status === 'PUBLISHED' || status === 'LIVE') {
          return true
        }
        
        return false
      })
    } catch (error: any) {
      console.error('Error fetching event posts:', error)
      // If that fails, try a simpler query
      try {
        eventPosts = await prisma.event.findMany({
          where: {
            ownerId: user.id, // Just get user's own events
          },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            _count: {
              select: {
                mediaAssets: true,
                interactions: true,
                invitees: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        })
      } catch (fallbackError: any) {
        console.error('Fallback query also failed:', fallbackError)
        eventPosts = []
      }
    }

    // Group media by event ID
    const mediaByEvent = new Map<string, any[]>()
    mediaPosts.forEach((media: any) => {
      const eventId = media.event?.id
      if (eventId) {
        if (!mediaByEvent.has(eventId)) {
          mediaByEvent.set(eventId, [])
        }
        mediaByEvent.get(eventId)!.push({
          id: media.id,
          url: media.url,
          thumbnailUrl: media.thumbnailUrl,
          type: media.type,
          caption: media.caption,
          uploadedBy: media.uploadedBy,
          createdAt: media.createdAt,
        })
      }
    })

    // Get like and comment counts for all events
    const eventPostIds = (eventPosts || []).map((e: any) => e.id)
    const likeCounts = new Map<string, number>()
    const commentCounts = new Map<string, number>()
    const userLikes = new Map<string, boolean>()

    if (eventPostIds.length > 0) {
      // Get like counts
      const likes = await prisma.interaction.groupBy({
        by: ['eventId'],
        where: {
          eventId: { in: eventPostIds },
          type: 'REACTION',
          reaction: 'LIKE',
          isApproved: true,
        },
        _count: {
          id: true,
        },
      })
      likes.forEach((like: any) => {
        likeCounts.set(like.eventId, like._count.id)
      })

      // Get comment counts
        const comments = await prisma.interaction.groupBy({
          by: ['eventId'],
          where: {
            eventId: { in: eventPostIds },
          type: 'COMMENT',
          isApproved: true,
        },
        _count: {
          id: true,
        },
      })
      comments.forEach((comment: any) => {
        commentCounts.set(comment.eventId, comment._count.id)
      })

      // Get user's likes
        const userLikesList = await prisma.interaction.findMany({
          where: {
            eventId: { in: eventPostIds },
          userId: user.id,
          type: 'REACTION',
          reaction: 'LIKE',
        },
        select: {
          eventId: true,
        },
      })
      userLikesList.forEach((like: any) => {
        userLikes.set(like.eventId, true)
      })
    }

    // Transform to timeline events format - one card per event with all media
    const events = (eventPosts || []).map((event: any) => {
      const eventId = event.id
      const eventTitle = event.title || 'Untitled Event'
      const eventType = event.type || 'CELEBRATION'
      const eventSlug = event.slug || null
      const eventDetails = eventDetailsMap.get(eventId) || {
        hasProgramme: false,
        hasLiveStream: false,
        liveStreamUrl: null,
        isOwner: ownedEventIds.includes(eventId),
      }
      
      // Get all media for this event
      const eventMedia = mediaByEvent.get(eventId) || []
      
      return {
        id: eventId,
        type: 'event' as const,
        author: {
          id: event.owner?.id || null,
          name: event.owner?.name || 'Event Creator',
          avatar: event.owner?.image || null,
        },
        content: event.description || null,
        event: {
          id: eventId,
          title: eventTitle,
          slug: eventSlug,
          type: eventType,
          ...eventDetails,
        },
        timestamp: event.createdAt?.toISOString() || new Date().toISOString(),
        eventDetails: {
          startDate: event.startDate?.toISOString() || null,
          endDate: event.endDate?.toISOString() || null,
          location: event.location || null,
          mediaCount: event._count?.mediaAssets || 0,
          inviteeCount: event._count?.invitees || 0,
          vendorCount: event._count?.eventVendors || 0,
        },
        media: eventMedia, // All media for this event
        likes: likeCounts.get(eventId) || 0,
        comments: commentCounts.get(eventId) || 0,
        hasLiked: userLikes.get(eventId) || false,
      }
    })

    // Transform to timeline posts format (keep interactions as separate posts)
    // EXCLUDE comments - they should only appear nested in event cards, not as separate posts
    const posts = [
      // Interaction posts (exclude comments and reactions - only show guestbook entries, blessings, wishes)
      ...(interactions || [])
        .filter((interaction: any) => {
          // Only include interactions that are NOT comments or reactions
          // Comments should only appear nested in event cards
          return interaction.type !== 'COMMENT' && interaction.type !== 'REACTION'
        })
        .map((interaction: any) => {
        const eventId = interaction.event?.id
        const eventDetails = eventId ? (eventDetailsMap.get(eventId) || {
          hasProgramme: false,
          hasLiveStream: false,
          liveStreamUrl: null,
          isOwner: ownedEventIds.includes(eventId),
        }) : {
          hasProgramme: false,
          hasLiveStream: false,
          liveStreamUrl: null,
          isOwner: false,
        }
        
        return {
          id: interaction.id,
          type: 'interaction' as const,
          author: {
            id: interaction.user?.id || null,
            name: interaction.user?.name || interaction.guestName || 'Anonymous',
            avatar: interaction.user?.image || null,
          },
          content: interaction.content || null,
          event: {
            id: eventId || 'unknown',
            title: interaction.event?.title || 'Unknown Event',
            slug: interaction.event?.slug || null,
            type: interaction.event?.type || 'CELEBRATION',
            ...eventDetails,
          },
          ceremony: interaction.ceremony
            ? {
                id: interaction.ceremony.id,
                name: interaction.ceremony.name,
              }
            : null,
          media: interaction.mediaAsset
            ? {
                id: interaction.mediaAsset.id,
                url: interaction.mediaAsset.url,
                thumbnailUrl: interaction.mediaAsset.thumbnailUrl,
                type: interaction.mediaAsset.type,
              }
            : null,
          timestamp: interaction.createdAt?.toISOString() || new Date().toISOString(),
          likes: 0, // Reactions are separate interactions - can be counted later if needed
          comments: 0, // Comments are separate interactions - can be counted later if needed
        }
      }),
    ]

    // Sort events by most recent activity (use latest media timestamp or event creation)
    const sortedEvents = events.sort((a, b) => {
      const aLatestMedia = a.media.length > 0 
        ? Math.max(...a.media.map((m: any) => new Date(m.createdAt).getTime()))
        : 0
      const bLatestMedia = b.media.length > 0
        ? Math.max(...b.media.map((m: any) => new Date(m.createdAt).getTime()))
        : 0
      const aTime = Math.max(new Date(a.timestamp).getTime(), aLatestMedia)
      const bTime = Math.max(new Date(b.timestamp).getTime(), bLatestMedia)
      return bTime - aTime
    })

    // Sort interactions by timestamp
    const sortedPosts = posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ 
      events: sortedEvents,
      posts: sortedPosts 
    })
  } catch (error: any) {
    console.error('Error fetching timeline:', error)
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error.message || 'Failed to fetch timeline')
      : 'Failed to fetch timeline'
    
    // Log full error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Timeline error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      },
      { status: 500 }
    )
  }
}

