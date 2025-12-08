/**
 * Vendor Invitation Service
 * Sends WhatsApp invitations to vendors when they're added to events
 */

import { sendWhatsAppVendorInvite } from './whatsapp-vendor.service'
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

  try {
    // Get vendor details
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
      },
    })

    if (!vendor) {
      return {
        success: false,
        error: 'Vendor not found',
      }
    }

    // Generate invitation token if not exists
    let invitationToken = vendor.invitationToken
    if (!invitationToken) {
      invitationToken = randomBytes(32).toString('hex')
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { invitationToken },
      })
    }

    // Get event details for invitation link
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

    // Send WhatsApp invitation
    const whatsappNumber = vendor.whatsapp || vendor.phone
    if (!whatsappNumber) {
      return {
        success: false,
        error: 'Vendor phone number not found',
      }
    }

    const result = await sendWhatsAppVendorInvite({
      to: whatsappNumber,
      vendorName: vendor.ownerName || vendor.businessName || 'Vendor',
      businessName: vendor.businessName || 'Vendor Service',
      eventTitle,
      eventOwnerName: eventOwnerName || 'Event Organizer',
      invitationLink,
      eventLink: event?.shareLink || `${baseUrl}/e/${event?.slug || eventId}`,
    })

    // Update vendor invitation status
    if (result.success) {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { invitationSent: true },
      })
    }

    return result
  } catch (error: any) {
    console.error('Error sending vendor invitation:', error)
    return {
      success: false,
      error: error.message || 'Failed to send vendor invitation',
    }
  }
}

