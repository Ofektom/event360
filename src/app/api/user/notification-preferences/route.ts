import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationChannel } from '@prisma/client'

/**
 * GET /api/user/notification-preferences
 * Get current user's notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        notificationChannels: true,
        whatsappChargesAccepted: true,
      },
    })

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      notificationChannels: userData.notificationChannels || [NotificationChannel.EMAIL],
      whatsappChargesAccepted: userData.whatsappChargesAccepted || false,
    })
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error)
    
    // If the error is about missing columns, it means migration hasn't been run
    if (error.message?.includes('column') || error.message?.includes('does not exist')) {
      console.warn('Database migration may not have been applied. Returning default preferences.')
      return NextResponse.json({
        notificationChannels: [NotificationChannel.EMAIL],
        whatsappChargesAccepted: false,
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch notification preferences',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/notification-preferences
 * Update current user's notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { notificationChannels, whatsappChargesAccepted } = body

    // Validate notification channels
    if (notificationChannels && Array.isArray(notificationChannels)) {
      const validChannels = Object.values(NotificationChannel)
      const invalidChannels = notificationChannels.filter(
        (ch: string) => !validChannels.includes(ch as NotificationChannel)
      )

      if (invalidChannels.length > 0) {
        return NextResponse.json(
          { error: `Invalid notification channels: ${invalidChannels.join(', ')}` },
          { status: 400 }
        )
      }

      // Ensure at least one channel is selected
      if (notificationChannels.length === 0) {
        return NextResponse.json(
          { error: 'At least one notification channel must be selected' },
          { status: 400 }
        )
      }
    }

    // Update user preferences
    const updateData: any = {}
    if (notificationChannels !== undefined) {
      updateData.notificationChannels = notificationChannels
    }
    if (whatsappChargesAccepted !== undefined) {
      updateData.whatsappChargesAccepted = Boolean(whatsappChargesAccepted)
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        notificationChannels: true,
        whatsappChargesAccepted: true,
      },
    })

    return NextResponse.json({
      notificationChannels: updatedUser.notificationChannels,
      whatsappChargesAccepted: updatedUser.whatsappChargesAccepted,
    })
  } catch (error: any) {
    console.error('Error updating notification preferences:', error)
    
    // If the error is about missing columns, it means migration hasn't been run
    if (error.message?.includes('column') || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: 'Database migration required. Please run: npx prisma migrate deploy',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update notification preferences',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

