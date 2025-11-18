import { NextRequest, NextResponse } from 'next/server'
import { InviteeService } from '@/services/invitee.service'
import { CreateInviteeDto, BulkCreateInviteesDto, GetInviteesFilters } from '@/types/invitee.types'
import { RSVPStatus } from '@/types/enums'

const inviteeService = new InviteeService()

// GET /api/events/[eventId]/invitees - Get all invitees for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const searchParams = request.nextUrl.searchParams
    const rsvpStatus = searchParams.get('rsvpStatus')

    const filters: GetInviteesFilters | undefined = rsvpStatus
      ? { rsvpStatus: rsvpStatus as RSVPStatus }
      : undefined

    const invitees = await inviteeService.getInviteesByEventId(eventId, filters)
    return NextResponse.json(invitees)
  } catch (error) {
    console.error('Error fetching invitees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitees' },
      { status: 500 }
    )
  }
}

// POST /api/events/[eventId]/invitees - Add invitees (bulk or single)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const body = await request.json()
    
    // Check if it's bulk or single invitee
    if (body.invitees && Array.isArray(body.invitees)) {
      // Bulk create
      const bulkData: BulkCreateInviteesDto = {
        invitees: body.invitees,
      }
      const result = await inviteeService.bulkCreateInvitees(eventId, bulkData)
      return NextResponse.json(
        { message: `Added ${result.count} invitees` },
        { status: 201 }
      )
    } else {
      // Single create
      const inviteeData: CreateInviteeDto = {
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role,
        group: body.group,
        preferredChannel: body.preferredChannel,
      }
      const invitee = await inviteeService.createInvitee(eventId, inviteeData)
      return NextResponse.json(invitee, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error creating invitees:', error)
    
    if (error.message.includes('required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create invitees' },
      { status: 500 }
    )
  }
}

