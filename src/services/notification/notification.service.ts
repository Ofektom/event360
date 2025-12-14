/**
 * Notification Service
 * 
 * Handles sending notifications via multiple channels (Email, WhatsApp, Facebook Messenger, etc.)
 * Respects user notification preferences
 */

import { prisma } from '@/lib/prisma'
import { NotificationChannel } from '@prisma/client'
import { sendEmailInvite } from '@/services/invite/email-simple.service'
import { sendWhatsAppInvite } from '@/services/invite/whatsapp-simple.service'
import { sendMessengerInvite } from '@/services/invite/messenger.service'
import { sendInstagramDMInvite } from '@/services/invite/instagram.service'
import { sendVendorInvitationEmail } from '@/services/email/vendor-invitation-simple.service'
import { sendWhatsAppVendorInvite } from '@/services/vendor/whatsapp-vendor-simple.service'
import { sendVerificationEmail } from '@/services/email/verification.service'

export interface NotificationOptions {
  userId?: string
  inviteeId?: string
  email?: string
  phone?: string
  whatsapp?: string
  messenger?: string
  instagram?: string
  name?: string
  eventId?: string
  eventTitle?: string
  invitationImageUrl?: string
  shareLink?: string
  token?: string
  // For vendor invitations
  vendorId?: string
  vendorName?: string
  businessName?: string
  eventOwnerName?: string
  invitationLink?: string
  eventLink?: string
  // For verification
  verificationLink?: string
}

export interface NotificationResult {
  success: boolean
  channels: {
    channel: NotificationChannel
    success: boolean
    error?: string
  }[]
  error?: string
}

/**
 * Get user's notification preferences
 */
async function getUserNotificationPreferences(
  userId?: string,
  inviteeId?: string
): Promise<NotificationChannel[]> {
  // If we have a userId, get preferences from User model
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationChannels: true },
    })
    if (user && user.notificationChannels.length > 0) {
      return user.notificationChannels
    }
  }

  // If we have an inviteeId, get preferences from Invitee model
  if (inviteeId) {
    const invitee = await prisma.invitee.findUnique({
      where: { id: inviteeId },
      select: { notificationChannels: true },
    })
    if (invitee && invitee.notificationChannels.length > 0) {
      return invitee.notificationChannels
    }
  }

  // Default to email only
  return [NotificationChannel.EMAIL]
}

/**
 * Check if user has accepted WhatsApp charges
 */
async function hasAcceptedWhatsAppCharges(
  userId?: string,
  inviteeId?: string
): Promise<boolean> {
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { whatsappChargesAccepted: true },
    })
    return user?.whatsappChargesAccepted || false
  }

  if (inviteeId) {
    const invitee = await prisma.invitee.findUnique({
      where: { id: inviteeId },
      select: { whatsappChargesAccepted: true },
    })
    return invitee?.whatsappChargesAccepted || false
  }

  return false
}

/**
 * Send guest invitation notification
 * Respects user preferences and sends via all enabled channels
 */
export async function sendGuestInvitationNotification(
  options: NotificationOptions
): Promise<NotificationResult> {
  const {
    userId,
    inviteeId,
    email,
    phone,
    whatsapp,
    messenger,
    instagram,
    name,
    eventId,
    eventTitle,
    invitationImageUrl,
    shareLink,
    token,
  } = options

  // Get user preferences
  const preferredChannels = await getUserNotificationPreferences(userId, inviteeId)
  const whatsappAccepted = await hasAcceptedWhatsAppCharges(userId, inviteeId)

  const results: NotificationResult['channels'] = []

  // Send via each preferred channel
  for (const channel of preferredChannels) {
    let success = false
    let error: string | undefined

    try {
      switch (channel) {
        case NotificationChannel.EMAIL:
          if (email) {
            const result = await sendEmailInvite({
              to: email,
              inviteeName: name || 'Guest',
              eventTitle: eventTitle || 'Event',
              invitationImageUrl: invitationImageUrl || '',
              shareLink: shareLink || '',
              token: token || '',
            })
            success = result.success
            error = result.error
          } else {
            error = 'Email address not provided'
          }
          break

        case NotificationChannel.WHATSAPP:
          // Check if user accepted charges
          if (!whatsappAccepted) {
            error = 'WhatsApp charges not accepted by user'
            break
          }
          if (whatsapp || phone) {
            const result = await sendWhatsAppInvite({
              to: whatsapp || phone || '',
              inviteeName: name || 'Guest',
              eventTitle: eventTitle || 'Event',
              invitationImageUrl: invitationImageUrl || '',
              shareLink: shareLink || '',
              token: token || '',
            })
            success = result.success
            error = result.error
          } else {
            error = 'WhatsApp number not provided'
          }
          break

        case NotificationChannel.FACEBOOK_MESSENGER:
          if (messenger) {
            const result = await sendMessengerInvite({
              to: messenger,
              inviteeName: name || 'Guest',
              eventTitle: eventTitle || 'Event',
              invitationImageUrl: invitationImageUrl || '',
              shareLink: shareLink || '',
              token: token || '',
            })
            success = result.success
            error = result.error
          } else {
            error = 'Facebook Messenger ID not provided'
          }
          break

        case NotificationChannel.INSTAGRAM_DM:
          if (instagram) {
            const result = await sendInstagramDMInvite({
              to: instagram.replace('@', ''),
              inviteeName: name || 'Guest',
              eventTitle: eventTitle || 'Event',
              invitationImageUrl: invitationImageUrl || '',
              shareLink: shareLink || '',
              token: token || '',
            })
            success = result.success
            error = result.error
          } else {
            error = 'Instagram handle not provided'
          }
          break

        case NotificationChannel.IN_APP:
          // In-app notifications are handled separately
          success = true
          break

        default:
          error = `Unsupported notification channel: ${channel}`
      }
    } catch (err: any) {
      error = err.message || 'Failed to send notification'
    }

    results.push({
      channel,
      success,
      error,
    })
  }

  // Consider it successful if at least one channel succeeded
  const overallSuccess = results.some((r) => r.success)

  return {
    success: overallSuccess,
    channels: results,
    error: overallSuccess ? undefined : 'All notification channels failed',
  }
}

/**
 * Send vendor invitation notification
 */
export async function sendVendorInvitationNotification(
  options: NotificationOptions
): Promise<NotificationResult> {
  const {
    userId,
    vendorId,
    email,
    phone,
    whatsapp,
    name,
    vendorName,
    businessName,
    eventTitle,
    eventOwnerName,
    invitationLink,
    eventLink,
  } = options

  // Get user preferences, or default to email + WhatsApp for vendors without preferences
  let preferredChannels = await getUserNotificationPreferences(userId)
  const whatsappAccepted = await hasAcceptedWhatsAppCharges(userId)

  // If no preferences set (defaults to EMAIL only), try both email and WhatsApp for vendors
  // This ensures vendors get invitations even if they haven't set preferences
  if (preferredChannels.length === 1 && preferredChannels[0] === NotificationChannel.EMAIL && !userId) {
    // Vendor without user account - try email first, then WhatsApp
    preferredChannels = [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP]
  }

  const results: NotificationResult['channels'] = []

  for (const channel of preferredChannels) {
    let success = false
    let error: string | undefined

    try {
      switch (channel) {
        case NotificationChannel.EMAIL:
          if (email) {
            const result = await sendVendorInvitationEmail({
              to: email,
              vendorName: vendorName || name || 'Vendor',
              eventTitle: eventTitle || 'Event',
              eventOrganizerName: eventOwnerName || 'Event Organizer',
              shareLink: invitationLink || eventLink || '',
            })
            success = result.success
            error = result.error
          } else {
            error = 'Email address not provided'
          }
          break

        case NotificationChannel.WHATSAPP:
          if (!whatsappAccepted) {
            error = 'WhatsApp charges not accepted by user'
            break
          }
          if (whatsapp || phone) {
            const result = await sendWhatsAppVendorInvite({
              to: whatsapp || phone || '',
              vendorName: vendorName || name || 'Vendor',
              businessName: businessName || '',
              eventTitle: eventTitle || 'Event',
              eventOwnerName: eventOwnerName || 'Event Organizer',
              invitationLink: invitationLink || '',
              eventLink: eventLink || '',
            })
            success = result.success
            error = result.error
          } else {
            error = 'WhatsApp number not provided'
          }
          break

        default:
          // For vendor invitations, we primarily use email and WhatsApp
          error = `Channel ${channel} not supported for vendor invitations`
      }
    } catch (err: any) {
      error = err.message || 'Failed to send notification'
    }

    results.push({
      channel,
      success,
      error,
    })
  }

  const overallSuccess = results.some((r) => r.success)

  return {
    success: overallSuccess,
    channels: results,
    error: overallSuccess ? undefined : 'All notification channels failed',
  }
}

/**
 * Send email verification notification
 * Always uses email (no preferences needed)
 */
export async function sendVerificationNotification(
  userId: string,
  email: string,
  name?: string
): Promise<{ success: boolean; error?: string }> {
  return await sendVerificationEmail(userId, email, name)
}

