/**
 * Vendor Invitation Service
 * Sends WhatsApp invitations to vendors when they're added to events
 */

import { sendWhatsAppVendorInvite } from './whatsapp-vendor-simple.service'
import { sendVendorInvitationNotification } from '@/services/notification/notification.service'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

interface SendVendorInvitationParams {
  vendorId: string
  eventId: string
  eventTitle: string
  eventOwnerName?: string
}

/**
 * Send vendor invitation via WhatsApp
 * Creates an invitation token and sends WhatsApp message to vendor
 */
export async function sendVendorInvitation(
  params: SendVendorInvitationParams
): Promise<{ success: boolean; error?: string }> {
  const { vendorId, eventId, eventTitle, eventOwnerName } = params
  const requestId = `vendor_invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    console.log(`[${requestId}] 🎯 Starting vendor invitation process`)
    console.log(`[${requestId}] 📋 Parameters:`, {
      vendorId,
      eventId,
      eventTitle,
      eventOwnerName,
    })
    // Get vendor details
    console.log(`[${requestId}] 🔍 Fetching vendor details...`)
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        email: true,
        phone: true,
        whatsapp: true,
        invitationToken: true,
        invitationSent: true,
        userId: true, // For notification preferences
      },
    })

    if (!vendor) {
      console.error(`[${requestId}] ❌ Vendor not found: ${vendorId}`)
      return {
        success: false,
        error: 'Vendor not found',
      }
    }

    console.log(`[${requestId}] ✅ Vendor found:`, {
      id: vendor.id,
      businessName: vendor.businessName,
      ownerName: vendor.ownerName,
      phone: vendor.phone,
      whatsapp: vendor.whatsapp,
      hasToken: !!vendor.invitationToken,
      invitationSent: vendor.invitationSent,
    })

    // Generate invitation token if not exists
    let invitationToken = vendor.invitationToken
    if (!invitationToken) {
      console.log(`[${requestId}] 🔑 Generating new invitation token...`)
      invitationToken = randomBytes(32).toString('hex')
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { invitationToken },
      })
      console.log(`[${requestId}] ✅ Invitation token generated: ${invitationToken.substring(0, 16)}...`)
    } else {
      console.log(`[${requestId}] ✅ Using existing invitation token: ${invitationToken.substring(0, 16)}...`)
    }

    // Get event details for invitation link
    console.log(`[${requestId}] 🔍 Fetching event details...`)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        slug: true,
        shareLink: true,
      },
    })

    // Create invitation link
    const { getBaseUrl } = await import('@/lib/utils')
    const baseUrl = getBaseUrl()
    const invitationLink = `${baseUrl}/vendor/invite/${invitationToken}`
    const eventLink = event?.shareLink || `${baseUrl}/e/${event?.slug || eventId}`

    console.log(`[${requestId}] 🔗 Links generated:`, {
      invitationLink,
      eventLink,
      baseUrl,
    })

    // Always use notification service - it will handle preferences or default to email + WhatsApp
    // For vendors without user accounts, the notification service will try email first, then WhatsApp
    console.log(`[${requestId}] 📤 Using notification service (respects preferences if vendor has user account)...`)
    let result: { success: boolean; error?: string }

    try {
      const notificationResult = await sendVendorInvitationNotification({
        userId: vendor.userId || undefined,
        vendorId: vendor.id,
        email: vendor.email || undefined,
        phone: vendor.phone || undefined,
        whatsapp: vendor.whatsapp || undefined,
        name: vendor.ownerName || undefined,
        vendorName: vendor.ownerName || vendor.businessName || 'Vendor',
        businessName: vendor.businessName || 'Vendor Service',
        eventTitle,
        eventOwnerName: eventOwnerName || 'Event Organizer',
        invitationLink,
        eventLink,
      })

      const successfulChannels = notificationResult.channels.filter(c => c.success)
      if (successfulChannels.length > 0) {
        result = { success: true }
        console.log(`[${requestId}] ✅ Vendor invitation sent via notification service:`, {
          successfulChannels: successfulChannels.map(c => c.channel),
          failedChannels: notificationResult.channels.filter(c => !c.success).map(c => ({ channel: c.channel, error: c.error }))
        })
      } else {
        // If notification service failed, try fallback to WhatsApp if available
        console.warn(`[${requestId}] ⚠️ Notification service failed, trying WhatsApp fallback...`)
        const whatsappNumber = vendor.whatsapp || vendor.phone
        if (whatsappNumber) {
          try {
            result = await sendWhatsAppVendorInvite({
              to: whatsappNumber,
              vendorName: vendor.ownerName || vendor.businessName || 'Vendor',
              businessName: vendor.businessName || 'Vendor Service',
              eventTitle,
              eventOwnerName: eventOwnerName || 'Event Organizer',
              invitationLink,
              eventLink,
            })
            console.log(`[${requestId}] 📥 WhatsApp fallback result:`, {
              success: result.success,
              error: result.error,
            })
          } catch (whatsappError: unknown) {
            const errorMessage = whatsappError instanceof Error ? whatsappError.message : 'Unknown error'
            result = {
              success: false,
              error: notificationResult.error || errorMessage || 'All notification channels failed'
            }
          }
        } else {
          result = {
            success: false,
            error: notificationResult.error || 'All notification channels failed and no WhatsApp number available'
          }
          console.error(`[${requestId}] ❌ All notification channels failed:`, notificationResult.channels)
        }
      }
    } catch (notificationError: unknown) {
      console.error(`[${requestId}] ❌ Notification service error, trying WhatsApp fallback:`, notificationError)
      // Fallback to WhatsApp if notification service throws an error
      const whatsappNumber = vendor.whatsapp || vendor.phone
      if (whatsappNumber) {
        try {
          result = await sendWhatsAppVendorInvite({
            to: whatsappNumber,
            vendorName: vendor.ownerName || vendor.businessName || 'Vendor',
            businessName: vendor.businessName || 'Vendor Service',
            eventTitle,
            eventOwnerName: eventOwnerName || 'Event Organizer',
            invitationLink,
            eventLink,
          })
        } catch (whatsappError: unknown) {
          const notificationErrorMessage = notificationError instanceof Error ? notificationError.message : 'Unknown error'
          const whatsappErrorMessage = whatsappError instanceof Error ? whatsappError.message : 'Unknown error'
          result = {
            success: false,
            error: notificationErrorMessage || whatsappErrorMessage || 'Failed to send vendor invitation'
          }
        }
      } else {
        const notificationErrorMessage = notificationError instanceof Error ? notificationError.message : 'Unknown error'
        result = {
          success: false,
          error: notificationErrorMessage || 'Failed to send vendor invitation and no WhatsApp number available'
        }
      }
    }

    // Update vendor invitation status
    if (result.success) {
      console.log(`[${requestId}] ✅ Updating vendor invitation status to 'sent'...`)
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { invitationSent: true },
      })
      console.log(`[${requestId}] ✅ Vendor invitation status updated successfully`)
    } else {
      console.error(`[${requestId}] ❌ Failed to send invitation, not updating status. Error: ${result.error}`)
    }

    console.log(`[${requestId}] 🎯 Vendor invitation process completed`)
    return result
  } catch (error: unknown) {
    console.error(`[${requestId}] ❌ Exception in sendVendorInvitation:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to send vendor invitation'
    if (error instanceof Error && error.stack) {
      console.error(`[${requestId}] ❌ Error stack:`, error.stack)
    }
    return {
      success: false,
      error: errorMessage,
    }
  }
}

