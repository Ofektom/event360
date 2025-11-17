import { NextRequest, NextResponse } from 'next/server'
import { CeremonyService } from '@/services/ceremony.service'
import { CreateCeremonyDto } from '@/types/ceremony.types'

const ceremonyService = new CeremonyService()

// GET /api/events/[eventId]/ceremonies - Get all ceremonies for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const ceremonies = await ceremonyService.getCeremoniesByEventId(params.eventId)
    return NextResponse.json(ceremonies)
  } catch (error) {
    console.error('Error fetching ceremonies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ceremonies' },
      { status: 500 }
    )
  }
}

// POST /api/events/[eventId]/ceremonies - Create a new ceremony
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await request.json()
    const ceremonyData: CreateCeremonyDto = {
      name: body.name,
      description: body.description,
      order: body.order,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location,
      venue: body.venue,
      dressCode: body.dressCode,
      notes: body.notes,
      streamUrl: body.streamUrl,
      streamKey: body.streamKey,
    }

    const ceremony = await ceremonyService.createCeremony(params.eventId, ceremonyData)
    return NextResponse.json(ceremony, { status: 201 })
  } catch (error: any) {
    console.error('Error creating ceremony:', error)
    
    if (error.message.includes('required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create ceremony' },
      { status: 500 }
    )
  }
}

