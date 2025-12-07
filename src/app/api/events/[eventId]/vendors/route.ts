import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/events/[eventId]/vendors - Get vendors for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    const eventVendors = await prisma.eventVendor.findMany({
      where: { eventId },
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(eventVendors)
  } catch (error) {
    console.error('Error fetching event vendors:', error)
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

    // Check if vendor is already added to this event
    const existingEventVendor = await prisma.eventVendor.findUnique({
      where: {
        eventId_vendorId: {
          eventId,
          vendorId,
        },
      },
    })

    if (existingEventVendor) {
      return NextResponse.json(
        { error: 'Vendor is already added to this event' },
        { status: 400 }
      )
    }

    // Add vendor to event
    const eventVendor = await prisma.eventVendor.create({
      data: {
        eventId,
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
          },
        },
      },
    })

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
        { error: 'Vendor is already added to this event' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add vendor to event' },
      { status: 500 }
    )
  }
}

