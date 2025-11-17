import { NextRequest, NextResponse } from 'next/server'
import { ScheduleService } from '@/services/schedule.service'
import { CreateScheduleItemDto } from '@/types/schedule.types'

const scheduleService = new ScheduleService()

// GET /api/ceremonies/[ceremonyId]/schedule - Get schedule items for a ceremony
export async function GET(
  request: NextRequest,
  { params }: { params: { ceremonyId: string } }
) {
  try {
    const scheduleItems = await scheduleService.getScheduleByCeremonyId(params.ceremonyId)
    return NextResponse.json(scheduleItems)
  } catch (error) {
    console.error('Error fetching schedule items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule items' },
      { status: 500 }
    )
  }
}

// POST /api/ceremonies/[ceremonyId]/schedule - Create a schedule item
export async function POST(
  request: NextRequest,
  { params }: { params: { ceremonyId: string } }
) {
  try {
    const body = await request.json()
    const scheduleData: CreateScheduleItemDto = {
      title: body.title,
      description: body.description,
      startTime: body.startTime,
      endTime: body.endTime,
      order: body.order,
      type: body.type,
      location: body.location,
      notes: body.notes,
    }

    const scheduleItem = await scheduleService.createScheduleItem(params.ceremonyId, scheduleData)
    return NextResponse.json(scheduleItem, { status: 201 })
  } catch (error: any) {
    console.error('Error creating schedule item:', error)
    
    if (error.message.includes('required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create schedule item' },
      { status: 500 }
    )
  }
}

