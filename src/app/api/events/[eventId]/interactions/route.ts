import { NextRequest, NextResponse } from 'next/server'
import { InteractionService } from '@/services/interaction.service'
import { CreateInteractionDto, GetInteractionsFilters } from '@/types/interaction.types'
import { InteractionType } from '@/types/enums'

const interactionService = new InteractionService()

// GET /api/events/[eventId]/interactions - Get all interactions for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const searchParams = request.nextUrl.searchParams
    const ceremonyId = searchParams.get('ceremonyId')
    const mediaAssetId = searchParams.get('mediaAssetId')
    const type = searchParams.get('type')
    const isApproved = searchParams.get('isApproved')

    const filters: GetInteractionsFilters = {}
    if (ceremonyId) filters.ceremonyId = ceremonyId
    if (mediaAssetId) filters.mediaAssetId = mediaAssetId
    if (type) filters.type = type as InteractionType
    if (isApproved !== null) filters.isApproved = isApproved === 'true'

    const interactions = await interactionService.getInteractionsByEventId(eventId, filters)
    return NextResponse.json(interactions)
  } catch (error) {
    console.error('Error fetching interactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    )
  }
}

// POST /api/events/[eventId]/interactions - Create an interaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const body = await request.json()
    const interactionData: CreateInteractionDto = {
      ceremonyId: body.ceremonyId,
      mediaAssetId: body.mediaAssetId,
      userId: body.userId,
      type: body.type as InteractionType,
      content: body.content,
      reaction: body.reaction,
      guestName: body.guestName,
      guestEmail: body.guestEmail,
    }

    const interaction = await interactionService.createInteraction(eventId, interactionData)
    return NextResponse.json(interaction, { status: 201 })
  } catch (error: any) {
    console.error('Error creating interaction:', error)
    
    if (error.message.includes('required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    )
  }
}

