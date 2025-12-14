/**
 * Simple WhatsApp Vendor Invitation Service
 * 
 * Uses WhatsApp web links (wa.me) to send vendor invitations
 * No API key or payment required - just generates a WhatsApp link
 */

interface SendWhatsAppVendorInviteParams {
  to: string
  vendorName: string
  businessName: string
  eventTitle: string
  eventOwnerName: string
  invitationLink: string
  eventLink?: string
}

/**
 * Format phone number for WhatsApp
 */
function formatPhoneNumber(phone: string): string {
  if (!phone || phone.trim().length === 0) {
    throw new Error('Phone number is required')
  }
  
  let cleaned = phone.trim().replace(/[^\d+]/g, '')
  cleaned = cleaned.replace(/^0+/, '')
  
  if (!cleaned.startsWith('+')) {
    if (phone.trim().startsWith('0') && phone.trim().replace(/[^\d]/g, '').length === 11) {
      cleaned = '+234' + cleaned
    } else if (cleaned.length === 10) {
      cleaned = '+234' + cleaned
    } else {
      cleaned = '+234' + cleaned
    }
  }
  
  return cleaned
}

/**
 * Send WhatsApp vendor invitation by generating a WhatsApp link
 */
export async function sendWhatsAppVendorInvite(
  params: SendWhatsAppVendorInviteParams
): Promise<{ success: boolean; error?: string; whatsappLink?: string }> {
  const { to, vendorName, businessName, eventTitle, eventOwnerName, invitationLink } = params

  try {
    const formattedPhone = formatPhoneNumber(to)

    const message = `🎉 Vendor Invitation!\n\nHi ${vendorName},\n\nYou've been added as a vendor for ${eventTitle}!\n\nClick the link below to:\n• Join our platform and manage your events\n• Update your vendor profile\n• Receive event reminders\n• Get rated by clients\n\n${invitationLink}\n\nEvent organized by: ${eventOwnerName}`

    const whatsappLink = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodeURIComponent(message)}`

    console.log(`📱 WhatsApp vendor invitation link generated for ${formattedPhone}`)

    return {
      success: true,
      whatsappLink,
    }
  } catch (error: any) {
    console.error('❌ Error generating WhatsApp vendor link:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate WhatsApp link',
    }
  }
}

