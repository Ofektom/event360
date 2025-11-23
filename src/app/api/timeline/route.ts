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
    const ownedEvents = await eventService.getEvents({ ownerId: user.id })
    
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

    // Get full event details with ceremonies, invitations, etc.
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
          invitationDesigns: {
            where: { isDefault: true },
            select: { id: true },
            take: 1,
          },
          _count: {
            select: {
              ceremonies: true,
              invitationDesigns: true,
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
    const eventDetailsMap = new Map(
      eventsWithDetails.map((event) => [
        event.id,
        {
          hasInvite: event._count.invitationDesigns > 0,
          hasProgramme: event._count.ceremonies > 0,
          hasLiveStream: event.ceremonies.some((c) => c.isStreaming),
          liveStreamUrl: event.ceremonies.find((c) => c.isStreaming)?.streamUrl || null,
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
      eventPosts = await prisma.event.findMany({
        where: {
          id: { in: eventsToQuery },
          OR: [
            // Published or live events visible to all
            { status: { in: ['PUBLISHED', 'LIVE'] } },
            // Draft events only visible to owner
            {
              status: 'DRAFT',
              ownerId: user.id,
            },
          ],
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
    } catch (error: any) {
      console.error('Error fetching event posts:', error)
      eventPosts = []
    }

    // Transform to timeline posts format
    const posts = [
      // Event creation posts
      ...(eventPosts || []).map((event) => ({
        id: `event-${event.id}`,
        type: 'event' as const,
        author: {
          id: event.owner.id,
          name: event.owner.name || 'Event Creator',
          avatar: event.owner.image || null,
        },
        content: event.description || `Created a new ${event.type.toLowerCase()} event: ${event.title}`,
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug,
          type: event.type,
          ...(eventDetailsMap.get(event.id) || {}),
        },
        ceremony: null,
        media: null,
        timestamp: event.createdAt.toISOString(),
        likes: 0,
        comments: event._count.interactions,
        eventDetails: {
          startDate: event.startDate?.toISOString() || null,
          endDate: event.endDate?.toISOString() || null,
          location: event.location,
          mediaCount: event._count.mediaAssets,
          inviteeCount: event._count.invitees,
        },
      })),
      // Interaction posts
      ...(interactions || []).map((interaction) => ({
        id: interaction.id,
        type: 'interaction' as const,
        author: {
          id: interaction.user?.id || null,
          name: interaction.user?.name || interaction.guestName || 'Anonymous',
          avatar: interaction.user?.image || null,
        },
        content: interaction.content || null,
        event: {
          id: interaction.event.id,
          title: interaction.event.title,
          slug: interaction.event.slug,
          type: interaction.event.type,
          ...(eventDetailsMap.get(interaction.event.id) || {}),
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
        timestamp: interaction.createdAt.toISOString(),
        likes: 0, // Reactions are separate interactions - can be counted later if needed
        comments: 0, // Comments are separate interactions - can be counted later if needed
      })),
      ...(mediaPosts || []).map((media) => ({
        id: media.id,
        type: 'media' as const,
        author: {
          id: media.uploadedBy?.id || null,
          name: media.uploadedBy?.name || 'Anonymous',
          avatar: media.uploadedBy?.image || null,
        },
        content: media.caption || null,
        event: {
          id: media.event.id,
          title: media.event.title,
          slug: media.event.slug,
          type: media.event.type,
          ...(eventDetailsMap.get(media.event.id) || {}),
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
        timestamp: media.createdAt.toISOString(),
        likes: media.likeCount,
        comments: media._count.interactions,
      })),
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

