import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CeremonyService } from '@/services/ceremony.service'

const ceremonyService = new CeremonyService()

// GET /api/ceremonies/[ceremonyId]/stream - Get stream info for a ceremony
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ceremonyId: string }> }
) {
  try {
    const { ceremonyId } = await params
    
    const ceremony = await prisma.ceremony.findUnique({
      where: { id: ceremonyId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            ownerId: true,
          },
        },
      },
    })

    if (!ceremony) {
      return NextResponse.json(
        { error: 'Ceremony not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: ceremony.id,
      name: ceremony.name,
      streamUrl: ceremony.streamUrl,
      isStreaming: ceremony.isStreaming,
      event: ceremony.event,
    })
  } catch (error: any) {
    console.error('Error fetching stream info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stream info' },
      { status: 500 }
    )
  }
}

// PATCH /api/ceremonies/[ceremonyId]/stream - Update stream status (start/stop)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ceremonyId: string }> }
) {
  try {
    const user = await requireAuth()
    const { ceremonyId } = await params
    const body = await request.json()

    // Get ceremony and check ownership
    const ceremony = await prisma.ceremony.findUnique({
      where: { id: ceremonyId },
      include: {
        event: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    })

    if (!ceremony) {
      return NextResponse.json(
        { error: 'Ceremony not found' },
        { status: 404 }
      )
    }

    // Only event owner can manage streams
    if (ceremony.event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Only event owner can manage streams.' },
        { status: 403 }
      )
    }

    // Update stream status
    const updateData: any = {}
    if (body.isStreaming !== undefined) {
      updateData.isStreaming = body.isStreaming
    }
    if (body.streamUrl !== undefined) {
      updateData.streamUrl = body.streamUrl
    }
    if (body.streamKey !== undefined) {
      updateData.streamKey = body.streamKey
    }

    const updated = await ceremonyService.updateCeremony(ceremonyId, updateData)

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      streamUrl: updated.streamUrl,
      isStreaming: updated.isStreaming,
    })
  } catch (error: any) {
    console.error('Error updating stream:', error)
    return NextResponse.json(
      { error: 'Failed to update stream' },
      { status: 500 }
    )
  }
}

