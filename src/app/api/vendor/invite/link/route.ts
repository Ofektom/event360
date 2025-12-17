import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/vendor/invite/link - Link existing user account to vendor profile
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find vendor by invitation token
    const vendor = await prisma.vendor.findUnique({
      where: { invitationToken: token },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check if vendor already has an account
    if (vendor.userId) {
      return NextResponse.json(
        { error: 'Vendor already linked to an account' },
        { status: 400 }
      )
    }

    // Verify email matches (both must exist for vendor linking)
    if (!user.email || !vendor.email) {
      return NextResponse.json(
        { error: 'Email is required to link vendor account' },
        { status: 400 }
      )
    }

    if (vendor.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email does not match vendor invitation' },
        { status: 400 }
      )
    }

    // Link vendor to user account
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        userId: user.id,
        isVerified: true, // Auto-verify when they link account
      },
    })

    return NextResponse.json({
      message: 'Vendor account linked successfully',
    })
  } catch (error: any) {
    console.error('Error linking vendor account:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to link vendor account' },
      { status: 500 }
    )
  }
}

