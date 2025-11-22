import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/invitations/designs - Get designs for an event
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Verify user owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true },
    })

    if (!event || event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const designs = await prisma.invitationDesign.findMany({
      where: { eventId },
      include: {
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
    console.error('Error fetching invitation designs:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch designs' },
      { status: 500 }
    )
  }
}

// POST /api/invitations/designs - Create a new invitation design
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { eventId, templateId, designData, name, customImage } = body

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Verify user owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true },
    })

    if (!event || event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // If this is the first design, make it default
    const existingDesigns = await prisma.invitationDesign.count({
      where: { eventId },
    })

    const design = await prisma.invitationDesign.create({
      data: {
        eventId,
        templateId: templateId || null,
        name: name || 'My Invitation Design',
        designData: designData || {},
        customImage: customImage || null,
        isDefault: existingDesigns === 0,
        isActive: true,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            preview: true,
          },
        },
      },
    })

    return NextResponse.json(design, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation design:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to create design' },
      { status: 500 }
    )
  }
}

