import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/invitations/designs/[designId] - Get a specific design
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ designId: string }> }
) {
  try {
    const user = await requireAuth()
    const { designId } = await params

    const design = await prisma.invitationDesign.findUnique({
      where: { id: designId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            config: true,
            preview: true,
          },
        },
        event: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    // Verify user owns the event
    if (design.event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(design)
  } catch (error) {
    console.error('Error fetching design:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch design' },
      { status: 500 }
    )
  }
}

// PATCH /api/invitations/designs/[designId] - Update a design
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ designId: string }> }
) {
  try {
    const user = await requireAuth()
    const { designId } = await params
    const body = await request.json()

    // Get design and verify ownership
    const existingDesign = await prisma.invitationDesign.findUnique({
      where: { id: designId },
      include: {
        event: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!existingDesign) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    if (existingDesign.event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const updatedDesign = await prisma.invitationDesign.update({
      where: { id: designId },
      data: {
        ...(body.designData && { designData: body.designData }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
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

    return NextResponse.json(updatedDesign)
  } catch (error) {
    console.error('Error updating design:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to update design' },
      { status: 500 }
    )
  }
}

// DELETE /api/invitations/designs/[designId] - Delete a design
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ designId: string }> }
) {
  try {
    const user = await requireAuth()
    const { designId } = await params

    // Get design and verify ownership
    const design = await prisma.invitationDesign.findUnique({
      where: { id: designId },
      include: {
        event: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    if (design.event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await prisma.invitationDesign.delete({
      where: { id: designId },
    })

    return NextResponse.json({ message: 'Design deleted successfully' })
  } catch (error) {
    console.error('Error deleting design:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to delete design' },
      { status: 500 }
    )
  }
}

