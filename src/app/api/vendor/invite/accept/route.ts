import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@/types/enums'

// POST /api/vendor/invite/accept - Accept vendor invitation and create account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email, password } = body

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: 'Token, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
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
        { error: 'Vendor already has an account' },
        { status: 400 }
      )
    }

    // Verify email matches vendor email
    if (vendor.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email does not match vendor invitation' },
        { status: 400 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists. Please login instead.' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user account and link to vendor
    const result = await prisma.$transaction(async (tx) => {
      // Create user with VENDOR role
      const user = await tx.user.create({
        data: {
          name: vendor.ownerName || vendor.businessName,
          email,
          phone: vendor.phone,
          passwordHash,
          role: UserRole.VENDOR,
        },
      })

      // Link vendor to user account
      await tx.vendor.update({
        where: { id: vendor.id },
        data: {
          userId: user.id,
          isVerified: true, // Auto-verify when they accept invitation
        },
      })

      return user
    })

    return NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
      },
    })
  } catch (error: any) {
    console.error('Error accepting vendor invitation:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}

