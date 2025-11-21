import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EventService } from '@/services/event.service'
import { getUserInvitedEvents } from '@/lib/invitee-linking'

const eventService = new EventService()

// GET /api/user/profile - Get current user's profile data
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const include = searchParams.get('include')?.split(',') || []

    // Get user's created events
    let createdEvents = []
    if (include.includes('events') || include.length === 0) {
      createdEvents = await eventService.getEvents({ ownerId: user.id })
    }

    // Get user's invited events
    let invitedEvents = []
    if (include.includes('invited') || include.length === 0) {
      invitedEvents = await getUserInvitedEvents(user.id)
    }

    // Get user's media uploads
    let mediaAssets = []
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
    let interactions = []
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

