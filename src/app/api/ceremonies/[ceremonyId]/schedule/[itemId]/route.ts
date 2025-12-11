import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { ScheduleService } from '@/services/schedule.service'
import { UpdateScheduleItemDto } from '@/types/schedule.types'
import { prisma } from '@/lib/prisma'

const scheduleService = new ScheduleService()

// GET /api/ceremonies/[ceremonyId]/schedule/[itemId] - Get a specific schedule item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ceremonyId: string; itemId: string }> }
) {
  try {
    const { itemId } = await params
    const item = await scheduleService.getScheduleItemById(itemId)
    return NextResponse.json(item)
  } catch (error: any) {
    if (error.message === 'Schedule item not found') {
      return NextResponse.json(
        { error: 'Schedule item not found' },
        { status: 404 }
      )
    }
    console.error('Error fetching schedule item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule item' },
      { status: 500 }
    )
  }
}

// PATCH /api/ceremonies/[ceremonyId]/schedule/[itemId] - Update a schedule item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ceremonyId: string; itemId: string }> }
) {
  try {
    const user = await requireAuth()
    const { ceremonyId, itemId } = await params
    const body = await request.json()

    // Verify user owns the event
    const ceremony = await prisma.ceremony.findUnique({
      where: { id: ceremonyId },
      include: {
        event: {
          select: { ownerId: true },
        },
      },
    })

    if (!ceremony || ceremony.event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const updateData: UpdateScheduleItemDto = {
      title: body.title,
      description: body.description !== undefined ? body.description : undefined,
      startTime: body.startTime,
      endTime: body.endTime !== undefined ? body.endTime : undefined,
      order: body.order !== undefined ? body.order : undefined,
      type: null, // Type is ceremony-level, not item-level
      location: null, // Location is ceremony-level, not item-level
      notes: body.notes !== undefined ? body.notes : undefined,
    }

    const updatedItem = await scheduleService.updateScheduleItem(itemId, updateData)
    return NextResponse.json(updatedItem)
  } catch (error: any) {
    console.error('Error updating schedule item:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error.message === 'Schedule item not found') {
      return NextResponse.json(
        { error: 'Schedule item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update schedule item' },
      { status: 500 }
    )
  }
}

// DELETE /api/ceremonies/[ceremonyId]/schedule/[itemId] - Delete a schedule item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ceremonyId: string; itemId: string }> }
) {
  try {
    const user = await requireAuth()
    const { ceremonyId, itemId } = await params

    // Verify user owns the event
    const ceremony = await prisma.ceremony.findUnique({
      where: { id: ceremonyId },
      include: {
        event: {
          select: { ownerId: true },
        },
      },
    })

    if (!ceremony || ceremony.event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await scheduleService.deleteScheduleItem(itemId)
    return NextResponse.json({ message: 'Schedule item deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting schedule item:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error.message === 'Schedule item not found') {
      return NextResponse.json(
        { error: 'Schedule item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete schedule item' },
      { status: 500 }
    )
  }
}

