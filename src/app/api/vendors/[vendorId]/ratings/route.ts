import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types/enums'

// POST /api/vendors/[vendorId]/ratings - Create a vendor rating
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const user = await requireAuth()
    const { vendorId } = await params
    const body = await request.json()

    // Prevent vendors from rating
    if (user.role === UserRole.VENDOR) {
      return NextResponse.json(
        { error: 'Vendors cannot rate other vendors' },
        { status: 403 }
      )
    }

    // Get vendor to check if user is trying to rate their own vendor profile
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { userId: true },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Prevent vendors from rating themselves
    if (vendor.userId === user.id) {
      return NextResponse.json(
        { error: 'You cannot rate your own business' },
        { status: 403 }
      )
    }

    // Validate rating
    const rating = parseInt(body.rating)
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if user has already rated this vendor for this event (if eventId provided)
    const eventId = body.eventId || null
    
    // Find existing rating - handle null eventId case
    const existingRating = await prisma.vendorRating.findFirst({
      where: {
        vendorId,
        userId: user.id,
        eventId: eventId || null,
      },
    })

    if (existingRating) {
      // Update existing rating
      const updatedRating = await prisma.$transaction(async (tx) => {
        const rating = await tx.vendorRating.update({
          where: { id: existingRating.id },
          data: {
            rating,
            review: body.review || null,
          },
        })

        // Recalculate vendor average rating
        const allRatings = await tx.vendorRating.findMany({
          where: { vendorId },
          select: { rating: true },
        })

        const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length

        await tx.vendor.update({
          where: { id: vendorId },
          data: {
            averageRating,
            totalRatings: allRatings.length,
          },
        })

        return rating
      })

      return NextResponse.json(updatedRating)
    }

    // Create new rating
    const newRating = await prisma.$transaction(async (tx) => {
      const rating = await tx.vendorRating.create({
        data: {
          vendorId,
          eventId: eventId || null,
          userId: user.id,
          rating,
          review: body.review || null,
        },
      })

      // Recalculate vendor average rating
      const allRatings = await tx.vendorRating.findMany({
        where: { vendorId },
        select: { rating: true },
      })

      const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length

      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          averageRating,
          totalRatings: allRatings.length,
        },
      })

      return rating
    })

    return NextResponse.json(newRating, { status: 201 })
  } catch (error: any) {
    console.error('Error creating vendor rating:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already rated this vendor for this event' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create rating' },
      { status: 500 }
    )
  }
}

// GET /api/vendors/[vendorId]/ratings - Get vendor ratings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')

    const where: any = { vendorId }
    if (eventId) {
      where.eventId = eventId
    }

    const ratings = await prisma.vendorRating.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(ratings)
  } catch (error) {
    console.error('Error fetching vendor ratings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    )
  }
}

