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
      // Fallback: query directly with Prisma
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
        console.error('Fallback query also failed:', fallbackError)
        ownedEvents = []
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
    if (eventIds.length === 0 && ownedEventIds.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    // If no eventIds but user has owned events, use owned events
    const eventsToQuery = eventIds.length > 0 ? eventIds : ownedEventIds

    if (eventsToQuery.length === 0) {
      return NextResponse.json({ posts: [] })
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
      eventPosts = allUserEvents.filter((event: any) => {
        const status = event.status || 'DRAFT'
        if (status === 'PUBLISHED' || status === 'LIVE') {
          return true
        }
        if (status === 'DRAFT' && event.ownerId === user.id) {
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

    // Transform to timeline posts format
    const posts = [
      // Event creation posts
      ...(eventPosts || []).map((event: any) => {
        // Ensure all required fields exist
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
        
        return {
          id: `event-${eventId}`,
          type: 'event' as const,
          author: {
            id: event.owner?.id || null,
            name: event.owner?.name || 'Event Creator',
            avatar: event.owner?.image || null,
          },
          content: event.description || `Created a new ${eventType.toLowerCase()} event: ${eventTitle}`,
          event: {
            id: eventId,
            title: eventTitle,
            slug: eventSlug,
            type: eventType,
            ...eventDetails,
          },
          ceremony: null,
          media: null,
          timestamp: event.createdAt?.toISOString() || new Date().toISOString(),
          likes: 0,
          comments: event._count?.interactions || 0,
          eventDetails: {
            startDate: event.startDate?.toISOString() || null,
            endDate: event.endDate?.toISOString() || null,
            location: event.location || null,
            mediaCount: event._count?.mediaAssets || 0,
            inviteeCount: event._count?.invitees || 0,
          },
        }
      }),
      // Interaction posts
      ...(interactions || []).map((interaction: any) => {
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
      ...(mediaPosts || []).map((media: any) => {
        const eventId = media.event?.id
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
          id: media.id,
          type: 'media' as const,
          author: {
            id: media.uploadedBy?.id || null,
            name: media.uploadedBy?.name || 'Anonymous',
            avatar: media.uploadedBy?.image || null,
          },
          content: media.caption || null,
          event: {
            id: eventId || 'unknown',
            title: media.event?.title || 'Unknown Event',
            slug: media.event?.slug || null,
            type: media.event?.type || 'CELEBRATION',
            ...eventDetails,
          },
          ceremony: media.ceremony
            ? {
                id: media.ceremony.id,
                name: media.ceremony.name,
              }
            : null,
          media: {
            id: media.id,
            url: media.url,
            thumbnailUrl: media.thumbnailUrl,
            type: media.type,
          },
          timestamp: media.createdAt?.toISOString() || new Date().toISOString(),
          likes: media.likeCount || 0,
          comments: media._count?.interactions || 0,
        }
      }),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ posts })
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

