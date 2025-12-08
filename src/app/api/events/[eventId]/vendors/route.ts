import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVendorInvitation } from '@/services/vendor/vendor-invitation.service'

// GET /api/events/[eventId]/vendors - Get vendors for an event or specific ceremony
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const searchParams = request.nextUrl.searchParams
    const ceremonyId = searchParams.get('ceremonyId')
    
    console.log(`[GET /api/events/${eventId}/vendors] Fetching vendors${ceremonyId ? ` for ceremony ${ceremonyId}` : ' for event'}`)

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    })

    if (!event) {
      console.error(`[GET /api/events/${eventId}/vendors] Event not found`)
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // If ceremonyId provided, verify it belongs to this event
    if (ceremonyId) {
      const ceremony = await prisma.ceremony.findUnique({
        where: { id: ceremonyId },
        select: { id: true, eventId: true },
      })

      if (!ceremony || ceremony.eventId !== eventId) {
        return NextResponse.json(
          { error: 'Ceremony not found or does not belong to this event' },
          { status: 404 }
        )
      }
    }

    const eventVendors = await prisma.eventVendor.findMany({
      where: {
        eventId,
        ...(ceremonyId && { ceremonyId }),
      },
      include: {
        vendor: {
          select: {
            id: true,
            ownerName: true,
            businessName: true,
            category: true,
            description: true,
            email: true,
            phone: true,
            whatsapp: true,
            website: true,
            city: true,
            state: true,
            logo: true,
            isVerified: true,
            averageRating: true,
            totalRatings: true,
          },
        },
        ceremony: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`[GET /api/events/${eventId}/vendors] Found ${eventVendors.length} vendors`)
    return NextResponse.json(eventVendors)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[GET /api/events/${(await params).eventId}/vendors] Error fetching vendors:`, errorMessage)
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack)
    }
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

// POST /api/events/[eventId]/vendors - Add vendor to event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId } = await params
    const body = await request.json()

    // Verify user owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only add vendors to your own events' },
        { status: 403 }
      )
    }

    let vendorId: string

    // Check if vendorId is provided (existing vendor) or vendor data (new vendor)
    if (body.vendorId) {
      // Use existing vendor
      vendorId = body.vendorId

      // Verify vendor exists
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
      })

      if (!vendor) {
        return NextResponse.json(
          { error: 'Vendor not found' },
          { status: 404 }
        )
      }
    } else {
      // Create new vendor
      const {
        ownerName,
        businessName,
        category,
        email,
        phone,
        whatsapp,
        address,
        city,
        state,
        country,
        description,
        website,
        socialMedia,
      } = body

      if (!businessName || !category || !email || !phone) {
        return NextResponse.json(
          { error: 'Business name, category, email, and phone are required' },
          { status: 400 }
        )
      }

      // Check if vendor with this email already exists
      const existingVendor = await prisma.vendor.findFirst({
        where: { email },
      })

      if (existingVendor) {
        vendorId = existingVendor.id
      } else {
        // Create new vendor
        const newVendor = await prisma.vendor.create({
          data: {
            ownerName: ownerName || null,
            businessName,
            category,
            email,
            phone,
            whatsapp: whatsapp || phone,
            address: address || null,
            city: city || null,
            state: state || null,
            country: country || 'Nigeria',
            description: description || null,
            website: website || null,
            socialMedia: socialMedia || null,
            isActive: true,
            isVerified: false,
            userId: null,
          },
        })
        vendorId = newVendor.id
      }
    }

    // Require ceremonyId for vendor assignment
    if (!body.ceremonyId) {
      return NextResponse.json(
        { error: 'Ceremony ID is required. Vendors must be assigned to a specific ceremony.' },
        { status: 400 }
      )
    }

    // Verify ceremony exists and belongs to this event
    const ceremony = await prisma.ceremony.findUnique({
      where: { id: body.ceremonyId },
      select: { id: true, eventId: true },
    })

    if (!ceremony) {
      return NextResponse.json(
        { error: 'Ceremony not found' },
        { status: 404 }
      )
    }

    if (ceremony.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Ceremony does not belong to this event' },
        { status: 400 }
      )
    }

    // Check if vendor is already added to this ceremony
    const existingEventVendor = await prisma.eventVendor.findUnique({
      where: {
        eventId_ceremonyId_vendorId: {
          eventId,
          ceremonyId: body.ceremonyId,
          vendorId,
        },
      },
    })

    if (existingEventVendor) {
      return NextResponse.json(
        { error: 'Vendor is already added to this ceremony' },
        { status: 400 }
      )
    }

    // Get event details for invitation
    const eventDetails = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        title: true,
        owner: {
          select: {
            name: true,
          },
        },
      },
    })

    // Add vendor to ceremony
    const eventVendor = await prisma.eventVendor.create({
      data: {
        eventId,
        ceremonyId: body.ceremonyId,
        vendorId,
        role: body.role || null,
        notes: body.notes || null,
        status: 'PENDING',
      },
      include: {
        vendor: {
          select: {
            id: true,
            ownerName: true,
            businessName: true,
            category: true,
            description: true,
            email: true,
            phone: true,
            whatsapp: true,
            website: true,
            city: true,
            state: true,
            logo: true,
            isVerified: true,
            averageRating: true,
            totalRatings: true,
            userId: true, // Check if vendor has account
          },
        },
      },
    })

    // Send WhatsApp invitation if vendor doesn't have an account yet
    // Only send if this is a newly created vendor (not already in system)
    if (!eventVendor.vendor.userId && !body.vendorId) {
      try {
        await sendVendorInvitation({
          vendorId,
          eventId,
          eventTitle: eventDetails?.title || 'Event',
          eventOwnerName: eventDetails?.owner?.name || user.name || undefined,
        })
      } catch (inviteError) {
        // Log error but don't fail the request
        console.error('Error sending vendor invitation:', inviteError)
      }
    }

    return NextResponse.json(eventVendor, { status: 201 })
  } catch (error: any) {
    console.error('Error adding vendor to event:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Vendor is already added to this ceremony' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add vendor to event' },
      { status: 500 }
    )
  }
}

