import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types/enums'

// GET /api/vendor/profile - Get vendor profile
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (user.role !== UserRole.VENDOR) {
      return NextResponse.json(
        { error: 'Unauthorized - Vendor access required' },
        { status: 403 }
      )
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(vendor)
  } catch (error: any) {
    console.error('Error fetching vendor profile:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch vendor profile' },
      { status: 500 }
    )
  }
}

// PATCH /api/vendor/profile - Update vendor profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (user.role !== UserRole.VENDOR) {
      return NextResponse.json(
        { error: 'Unauthorized - Vendor access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Get vendor to ensure it exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    })

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    // Update vendor profile
    const updatedVendor = await prisma.vendor.update({
      where: { userId: user.id },
      data: {
        ownerName: body.ownerName,
        businessName: body.businessName,
        category: body.category,
        description: body.description,
        phone: body.phone,
        whatsapp: body.whatsapp,
        website: body.website,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        socialMedia: body.socialMedia,
      },
    })

    return NextResponse.json(updatedVendor)
  } catch (error: any) {
    console.error('Error updating vendor profile:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update vendor profile' },
      { status: 500 }
    )
  }
}

