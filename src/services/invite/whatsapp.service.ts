/**
 * WhatsApp Invitation Service using SendZen
 * 
 * SendZen provides WhatsApp Business API with:
 * - 600 free messages per month
 * - Official Meta WhatsApp Business API
 * - REST API integration
 * 
 * Documentation: https://www.sendzen.io/docs
 * Sign up: https://www.sendzen.io/
 */

interface SendWhatsAppInviteParams {
  to: string
  inviteeName: string
  eventTitle: string
  invitationImageUrl: string
  shareLink: string
  token: string
}

/**
 * Format phone number for WhatsApp
 * Ensures it includes country code and is in E.164 format
 */
function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // If it doesn't start with +, add it (assuming default country code)
  if (!cleaned.startsWith('+')) {
    // You might want to add logic to detect country code
    // For now, we'll assume the number is already in correct format or add +1 for US
    cleaned = `+${cleaned}`
  }
  
  return cleaned
}

/**
 * Send WhatsApp invitation using SendZen API
 */
export async function sendWhatsAppInvite(
  params: SendWhatsAppInviteParams
): Promise<{ success: boolean; error?: string }> {
  const { to, inviteeName, eventTitle, invitationImageUrl, shareLink } = params

  try {
    // Check if SendZen is configured
    const apiKey = process.env.SENDZEN_API_KEY
    const apiUrl = process.env.SENDZEN_API_URL || 'https://api.sendzen.io'
    const phoneNumberId = process.env.SENDZEN_PHONE_NUMBER_ID

    // Development mode fallback
    if (!apiKey && process.env.NODE_ENV === 'development') {
      const message = `🎉 You're invited to ${eventTitle}!\n\nHi ${inviteeName}, you're invited to ${eventTitle}!\n\nClick the link to:\n• View your invitation\n• See event photos\n• Stream the event live\n\n${shareLink}`
      
      console.log('📱 WhatsApp Invite (Dev Mode - SendZen not configured):', {
        to,
        inviteeName,
        eventTitle,
        invitationImageUrl,
        shareLink,
        message,
      })

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { success: true }
    }

    if (!apiKey) {
      return {
        success: false,
        error: 'WhatsApp service not configured. Please set SENDZEN_API_KEY in environment variables.',
      }
    }

    if (!phoneNumberId) {
      return {
        success: false,
        error: 'WhatsApp phone number not configured. Please set SENDZEN_PHONE_NUMBER_ID in environment variables.',
      }
    }

    // Format phone number
    const formattedTo = formatPhoneNumber(to)

    // Create message content
    const messageText = `🎉 You're invited to ${eventTitle}!\n\nHi ${inviteeName}, you're invited to ${eventTitle}!\n\nClick the link to:\n• View your invitation\n• See event photos\n• Stream the event live\n\n${shareLink}`

    // Prepare request body based on SendZen API format
    // SendZen uses WhatsApp Business API format
    const requestBody: any = {
      messaging_product: 'whatsapp',
      to: formattedTo,
      recipient_type: 'individual',
    }

    // If we have an image, send as media message with caption
    if (invitationImageUrl) {
      requestBody.type = 'image'
      requestBody.image = {
        link: invitationImageUrl,
        caption: messageText,
      }
    } else {
      // Send as text message
      requestBody.type = 'text'
      requestBody.text = {
        preview_url: false, // Set to true if you want link previews
        body: messageText,
      }
    }

    // Make API request to SendZen
    // Note: SendZen API endpoint may vary - check their documentation
    // Common patterns: /v1/messages, /api/v1/messages, /whatsapp/messages
    const response = await fetch(`${apiUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('SendZen API Error:', responseData)
      
      // Handle specific error cases
      if (response.status === 401) {
        return {
          success: false,
          error: 'Invalid API key. Please check SENDZEN_API_KEY in environment variables.',
        }
      }
      
      if (response.status === 400) {
        return {
          success: false,
          error: responseData.error?.message || 'Invalid request. Please check phone number format.',
        }
      }

      return {
        success: false,
        error: responseData.error?.message || `Failed to send WhatsApp message: ${response.statusText}`,
      }
    }

    console.log('✅ WhatsApp message sent via SendZen:', responseData)

    return { success: true }
  } catch (error: any) {
    console.error('Error sending WhatsApp invite:', error)
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Unable to connect to WhatsApp service. Please check your internet connection and API URL.',
      }
    }

    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp invitation',
    }
  }
}

