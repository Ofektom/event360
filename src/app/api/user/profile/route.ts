import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserInvitedEvents } from '@/lib/invitee-linking'
import { Prisma } from '@prisma/client'

type EventWithRelations = Prisma.EventGetPayload<{
  include: {
    theme: true
    ceremonies: true
    _count: {
      select: {
        invitees: true
        mediaAssets: true
      }
    }
  }
}>

type MediaAssetWithEvent = Prisma.MediaAssetGetPayload<{
  include: {
    event: {
      select: {
        id: true
        title: true
        slug: true
      }
    }
  }
}>

type InteractionWithEvent = Prisma.InteractionGetPayload<{
  include: {
    event: {
      select: {
        id: true
        title: true
        slug: true
      }
    }
  }
}>

// GET /api/user/profile - Get current user's profile data
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireAuth()
    
    // Fetch full user from database to get all fields including phone
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const include = searchParams.get('include')?.split(',') || []

    // Get user's created events - using userId as foreign key, not eventService
    let createdEvents: EventWithRelations[] = []
    if (include.includes('events') || include.length === 0) {
      try {
        createdEvents = await prisma.event.findMany({
          where: { ownerId: user.id }, // userId is the foreign key
          include: {
            theme: true,
            ceremonies: {
              orderBy: { order: 'asc' },
            },
            _count: {
              select: {
                invitees: true,
                mediaAssets: true,
                ceremonies: true,
                interactions: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
      } catch (error: any) {
        // If ceremonies orderBy fails, try without it
        if (error?.message?.includes('order')) {
          createdEvents = await prisma.event.findMany({
            where: { ownerId: user.id },
            include: {
              theme: true,
              ceremonies: true,
              _count: {
                select: {
                  invitees: true,
                  mediaAssets: true,
                  ceremonies: true,
                  interactions: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        } else {
          throw error
        }
      }
    }

    // Get user's invited events
    let invitedEvents: Awaited<ReturnType<typeof getUserInvitedEvents>> = []
    if (include.includes('invited') || include.length === 0) {
      invitedEvents = await getUserInvitedEvents(user.id)
    }

    // Get user's media uploads
    let mediaAssets: MediaAssetWithEvent[] = []
    if (include.includes('media') || include.length === 0) {
      mediaAssets = await prisma.mediaAsset.findMany({
        where: {
          uploadedById: user.id,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20, // Limit to recent 20
      })
    }

    // Get user's interactions
    let interactions: InteractionWithEvent[] = []
    if (include.includes('interactions') || include.length === 0) {
      interactions = await prisma.interaction.findMany({
        where: {
          userId: user.id,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20, // Limit to recent 20
      })
    }

    // Get statistics
    const stats = {
      eventsCreated: await prisma.event.count({
        where: { ownerId: user.id },
      }),
      eventsInvited: await prisma.invitee.count({
        where: { userId: user.id },
      }),
      mediaUploaded: await prisma.mediaAsset.count({
        where: { uploadedById: user.id },
      }),
      interactionsMade: await prisma.interaction.count({
        where: { userId: user.id },
      }),
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
      },
      stats,
      createdEvents,
      invitedEvents,
      mediaAssets,
      interactions,
    })
  } catch (error: any) {
    console.error('Error fetching user profile:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PATCH /api/user/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { name, phone, image } = body

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(image !== undefined && { image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    console.error('Error updating user profile:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

