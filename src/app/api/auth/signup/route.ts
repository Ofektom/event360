import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { linkUserToInvitees } from '@/lib/invitee-linking'
import { normalizePhone } from '@/lib/phone-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password } = body

    // Validation: at least one identifier required
    if ((!email || email.trim() === '') && (!phone || phone.trim() === '')) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      )
    }

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Name and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone ? normalizePhone(phone) : null
    const normalizedEmail = email ? email.trim().toLowerCase() : null

    // Check if user already exists by email or phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ]
      }
    })

    if (existingUser) {
      const identifier = existingUser.email ? 'email' : 'phone'
      return NextResponse.json(
        { error: `User with this ${identifier} already exists` },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    })

    // Auto-link user to any matching invitees
    try {
      await linkUserToInvitees(
        user.id, 
        user.email || undefined, 
        user.phone || undefined
      )
    } catch (linkError) {
      // Non-critical error, log but don't fail signup
      console.error('Error auto-linking invitees during signup:', linkError)
    }

    return NextResponse.json(
      { message: 'Account created successfully', user },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating user:', error)
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'identifier'
      return NextResponse.json(
        { error: `User with this ${field} already exists` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}

