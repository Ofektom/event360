import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@/types/enums'

export async function POST(request: NextRequest) {
  try {
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
      password,
    } = body

    // Validation
    if (!ownerName || !businessName || !category || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Owner name, business name, category, email, phone, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Check if vendor with this email already exists
    const existingVendor = await prisma.vendor.findFirst({
      where: { email },
    })

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user account and link to existing vendor OR create new vendor
    const result = await prisma.$transaction(async (tx) => {
      // Create user with VENDOR role
      const user = await tx.user.create({
        data: {
          name: ownerName,
          email,
          phone,
          passwordHash,
          role: UserRole.VENDOR,
        },
      })

      let vendor

      if (existingVendor) {
        // Link existing vendor to user account
        // Preserve existing vendor data, only update if new data is provided
        const updateData: any = {
          userId: user.id,
          isVerified: true, // Auto-verify when vendor signs up and links account
        }

        // Only update fields if new values are provided
        if (ownerName) updateData.ownerName = ownerName
        if (businessName) updateData.businessName = businessName
        if (phone) updateData.phone = phone
        if (whatsapp) updateData.whatsapp = whatsapp
        if (address) updateData.address = address
        if (city) updateData.city = city
        if (state) updateData.state = state
        if (country) updateData.country = country

        vendor = await tx.vendor.update({
          where: { id: existingVendor.id },
          data: updateData,
        })
      } else {
        // Create new vendor profile (for vendors signing up directly without being added to event first)
        vendor = await tx.vendor.create({
          data: {
            ownerName,
            businessName,
            category,
            email,
            phone,
            whatsapp: whatsapp || phone,
            address,
            city,
            state,
            country: country || 'Nigeria',
            userId: user.id,
            isActive: true,
            // Vendor is auto-verified when they sign up directly
            isVerified: true,
          },
        })
      }

      return { user, vendor }
    })

    return NextResponse.json(
      {
        message: existingVendor 
          ? 'Account created and linked to existing vendor profile successfully'
          : 'Vendor account created successfully',
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
        vendor: {
          id: result.vendor.id,
          businessName: result.vendor.businessName,
          category: result.vendor.category,
        },
        linkedToExisting: !!existingVendor,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating vendor account:', error)
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field'
      return NextResponse.json(
        { error: `A vendor with this ${field} already exists` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create vendor account' },
      { status: 500 }
    )
  }
}

