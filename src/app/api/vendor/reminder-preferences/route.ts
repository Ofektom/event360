import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types/enums'

// PATCH /api/vendor/reminder-preferences - Update reminder preferences
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

    // Update reminder preferences
    const updatedVendor = await prisma.vendor.update({
      where: { userId: user.id },
      data: {
        reminderPreferences: {
          whatsapp: body.whatsapp ?? true,
          email: body.email ?? true,
          daysBefore: body.daysBefore || [7, 1],
        },
      },
    })

    return NextResponse.json({
      message: 'Reminder preferences updated successfully',
      reminderPreferences: updatedVendor.reminderPreferences,
    })
  } catch (error: any) {
    console.error('Error updating reminder preferences:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update reminder preferences' },
      { status: 500 }
    )
  }
}

