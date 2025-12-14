/**
 * Simple WhatsApp Invitation Service
 * 
 * Uses WhatsApp web links (wa.me) to send invitations
 * No API key or payment required - just generates a WhatsApp link
 */

interface SendWhatsAppInviteParams {
  to: string
  inviteeName: string
  eventTitle: string
  invitationImageUrl?: string
  shareLink: string
  token: string
}

/**
 * Format phone number for WhatsApp
 * Ensures it includes country code and is in E.164 format (+[country code][number])
 */
function formatPhoneNumber(phone: string): string {
  if (!phone || phone.trim().length === 0) {
    throw new Error('Phone number is required')
  }
  
  // Remove any non-digit characters except +
  let cleaned = phone.trim().replace(/[^\d+]/g, '')
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '')
  
  // If it doesn't start with +, add default country code (Nigeria: +234)
  if (!cleaned.startsWith('+')) {
    // If it's 10 digits starting with 0, it's likely Nigeria
    if (phone.trim().startsWith('0') && phone.trim().replace(/[^\d]/g, '').length === 11) {
      cleaned = '+234' + cleaned
    } else if (cleaned.length === 10) {
      // 10 digits without country code - assume Nigeria
      cleaned = '+234' + cleaned
    } else {
      // Try to detect other patterns or default to Nigeria
      cleaned = '+234' + cleaned
    }
  }
  
  return cleaned
}

/**
 * Send WhatsApp invitation by generating a WhatsApp link
 * Returns the link that can be opened in WhatsApp
 */
export async function sendWhatsAppInvite(
  params: SendWhatsAppInviteParams
): Promise<{ success: boolean; error?: string; whatsappLink?: string }> {
  const { to, inviteeName, eventTitle, shareLink, invitationImageUrl } = params

  try {
    // Format phone number
    const formattedPhone = formatPhoneNumber(to)

    // Create invitation message
    let message = `🎉 You're Invited!\n\nHi ${inviteeName},\n\nYou've been invited to ${eventTitle}!\n\n`
    
    // Add image URL if provided (WhatsApp will show a link preview)
    // Put image URL on its own line for better preview generation
    if (invitationImageUrl && invitationImageUrl.trim() !== '' && !invitationImageUrl.startsWith('data:')) {
      message += `${invitationImageUrl}\n\n`
    }
    
    message += `Click the link below to view event details and RSVP:\n${shareLink}\n\nWe hope to see you there!`

    // Generate WhatsApp link
    const whatsappLink = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodeURIComponent(message)}`

    // In a real implementation, you might want to:
    // 1. Open this link in a new window/tab
    // 2. Or return it to the frontend to handle
    // 3. Or use a service to actually send the message

    console.log(`📱 WhatsApp invitation link generated for ${formattedPhone}`)
    console.log(`📱 Link: ${whatsappLink.substring(0, 100)}...`)

    // For now, we'll return success with the link
    // The frontend can open this link or the backend can redirect to it
    return {
      success: true,
      whatsappLink,
    }
  } catch (error: any) {
    console.error('❌ Error generating WhatsApp link:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate WhatsApp link',
    }
  }
}

