import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/vendors - Search/list vendors
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const search = searchParams.get('search')
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      isActive: true,
    }

    if (category) {
      where.category = category
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    if (state) {
      where.state = { contains: state, mode: 'insensitive' }
    }

    if (verifiedOnly) {
      where.isVerified = true
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const vendors = await prisma.vendor.findMany({
      where,
      take: limit,
      orderBy: [
        { isVerified: 'desc' },
        { averageRating: 'desc' },
        { totalRatings: 'desc' },
      ],
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
        country: true,
        logo: true,
        isVerified: true,
        averageRating: true,
        totalRatings: true,
      },
    })

    return NextResponse.json(vendors)
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

// POST /api/vendors - Create a new vendor (for event owners)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

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

    // Validation
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
      // Return existing vendor instead of creating duplicate
      return NextResponse.json(existingVendor, { status: 200 })
    }

    // Create vendor (not verified, no userId - can be linked later if vendor signs up)
    const vendor = await prisma.vendor.create({
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
        isVerified: false, // Not verified until vendor signs up
        userId: null, // Will be linked when vendor signs up
      },
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error: any) {
    console.error('Error creating vendor:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Handle unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field'
      return NextResponse.json(
        { error: `A vendor with this ${field} already exists` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    )
  }
}

