import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/posts/[postId] - Get a single post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireAuth()
    const { postId } = await params

    // Check if it's an event post (format: event-{eventId})
    if (postId.startsWith('event-')) {
      const eventId = postId.replace('event-', '')
      
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
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
              ceremonies: true,
              mediaAssets: true,
              interactions: true,
              invitees: true,
            },
          },
        },
      })

      if (!event) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      // Check access permissions
      const isOwner = event.ownerId === user.id
      const isInvited = await prisma.invitee.findFirst({
        where: {
          eventId: event.id,
          userId: user.id,
        },
      })

      if (!isOwner && !isInvited && event.status !== 'PUBLISHED' && event.status !== 'LIVE') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      const post = {
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
          hasProgramme: event._count.ceremonies > 0,
          hasLiveStream: event.ceremonies.some((c: any) => c?.isStreaming),
          liveStreamUrl: event.ceremonies.find((c: any) => c?.isStreaming)?.streamUrl || null,
          isOwner: isOwner,
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
      }

      return NextResponse.json({ post })
    }

    // Try to find as interaction
    const interaction = await prisma.interaction.findUnique({
      where: { id: postId },
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
          },
        },
        ceremony: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (interaction) {
      // Check access
      const isOwner = interaction.event.ownerId === user.id
      const isInvited = await prisma.invitee.findFirst({
        where: {
          eventId: interaction.eventId,
          userId: user.id,
        },
      })

      if (!isOwner && !isInvited) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      const post = {
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
          isOwner: isOwner,
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
        likes: 0,
        comments: 0,
      }

      return NextResponse.json({ post })
    }

    // Try to find as media asset
    const media = await prisma.mediaAsset.findUnique({
      where: { id: postId },
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
    })

    if (media) {
      // Check access
      const isOwner = media.event.ownerId === user.id
      const isInvited = await prisma.invitee.findFirst({
        where: {
          eventId: media.eventId,
          userId: user.id,
        },
      })

      if (!isOwner && !isInvited) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      const post = {
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
          isOwner: isOwner,
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
      }

      return NextResponse.json({ post })
    }

    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  } catch (error: any) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

