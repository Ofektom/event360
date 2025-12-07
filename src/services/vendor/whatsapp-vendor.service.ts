/**
 * WhatsApp Vendor Invitation Service using SendZen
 * Sends vendor invitation messages via WhatsApp
 */

interface SendWhatsAppVendorInviteParams {
  to: string
  vendorName: string
  businessName: string
  eventTitle: string
  eventOwnerName: string
  invitationLink: string
  eventLink: string
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
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = `+${cleaned}`
    } else if (cleaned.length === 10) {
      cleaned = `+1${cleaned}`
    } else if (cleaned.length >= 9 && cleaned.length <= 15) {
      cleaned = `+1${cleaned}`
    } else {
      cleaned = `+${cleaned}`
    }
  }
  
  return cleaned
}

/**
 * Send WhatsApp vendor invitation using SendZen API
 */
export async function sendWhatsAppVendorInvite(
  params: SendWhatsAppVendorInviteParams
): Promise<{ success: boolean; error?: string }> {
  const { to, vendorName, businessName, eventTitle, eventOwnerName, invitationLink, eventLink } = params
  const requestId = `vendor_invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    console.log(`[${requestId}] 📱 Vendor WhatsApp Invite Request Started`)
    console.log(`[${requestId}] Parameters:`, {
      to,
      vendorName,
      businessName,
      eventTitle,
      eventOwnerName,
      invitationLink,
      eventLink,
    })

    // Check if SendZen is configured
    const apiKey = process.env.SENDZEN_API_KEY
    const apiUrl = process.env.SENDZEN_API_URL || 'https://api.sendzen.io'
    const fromPhoneNumber = process.env.SENDZEN_PHONE_NUMBER || process.env.SENDZEN_PHONE_NUMBER_ID
    const templateName = process.env.SENDZEN_VENDOR_TEMPLATE_NAME || 'vendor_invitation'
    const templateLanguage = process.env.SENDZEN_TEMPLATE_LANGUAGE || 'en_US'
    const useTemplate = process.env.SENDZEN_USE_TEMPLATE !== 'false'

    // Development mode fallback
    if (!apiKey && process.env.NODE_ENV === 'development') {
      const message = `🎉 Vendor Invitation!\n\nHi ${vendorName}, you've been added as a vendor for ${eventTitle}!\n\nClick the link below to:\n• Join our platform and manage your events\n• Update your vendor profile\n• Receive event reminders\n• Get rated by clients\n\n${invitationLink}`
      
      console.log(`[${requestId}] 📱 Vendor WhatsApp Invite (Dev Mode):`, message)
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { success: true }
    }

    if (!apiKey || !fromPhoneNumber) {
      console.error(`[${requestId}] ❌ SendZen not configured`)
      return {
        success: false,
        error: 'WhatsApp service not configured',
      }
    }

    // Format phone numbers
    let formattedFrom: string
    let formattedTo: string
    try {
      formattedFrom = formatPhoneNumber(fromPhoneNumber)
      formattedTo = formatPhoneNumber(to)
    } catch (formatError: any) {
      return {
        success: false,
        error: `Invalid phone number: ${formatError.message}`,
      }
    }

    // Create message content (fallback for non-template messages)
    const messageText = `🎉 Vendor Invitation!\n\nHi ${vendorName}, you've been added as a vendor for ${eventTitle}!\n\nClick the link below to:\n• Join our platform and manage your events\n• Update your vendor profile\n• Receive event reminders\n• Get rated by clients\n\n${invitationLink}`

    // Prepare request body
    let requestBody: any = {
      from: formattedFrom,
      to: formattedTo,
    }

    // Try template message first if enabled
    if (useTemplate && templateName) {
      console.log(`[${requestId}] 📋 Preparing vendor invitation template message: ${templateName}`)
      
      requestBody.type = 'template'
      requestBody.template = {
        name: templateName,
        language: {
          code: templateLanguage,
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: vendorName, // {{1}} - Vendor Name
              },
              {
                type: 'text',
                text: eventTitle, // {{2}} - Event Title
              },
              {
                type: 'text',
                text: invitationLink, // {{3}} - Vendor Invitation Link
              },
            ],
          },
        ],
      }
      
      console.log(`[${requestId}] 📋 Template message prepared with variables:`, {
        '{{1}}': vendorName,
        '{{2}}': eventTitle,
        '{{3}}': invitationLink,
      })
    } else {
      // Fall back to regular message
      console.log(`[${requestId}] 📝 Preparing regular vendor invitation message...`)
      requestBody.type = 'text'
      requestBody.text = {
        preview_url: true,
        body: messageText,
      }
    }

    // Make API request to SendZen
    const apiEndpoint = `${apiUrl}/v1/messages`
    console.log(`[${requestId}] 🌐 Making API request to: ${apiEndpoint}`)

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseData = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error(`[${requestId}] ❌ SendZen API Error:`, responseData)
      
      // If template fails, try regular message
      if (useTemplate && requestBody.type === 'template') {
        console.log(`[${requestId}] ⚠️ Template failed, trying regular message...`)
        const fallbackBody = {
          from: formattedFrom,
          to: formattedTo,
          type: 'text',
          text: {
            preview_url: true,
            body: messageText,
          },
        }

        const retryResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fallbackBody),
        })

        if (retryResponse.ok) {
          console.log(`[${requestId}] ✅ Fallback message sent successfully`)
          return { success: true }
        }
      }

      const errorMessage = responseData?.error?.message || 
                         responseData?.message || 
                         'Failed to send WhatsApp message'
      return {
        success: false,
        error: errorMessage,
      }
    }

    console.log(`[${requestId}] ✅ Vendor WhatsApp invitation sent successfully!`)
    return { success: true }
  } catch (error: any) {
    console.error(`[${requestId}] ❌ Exception in sendWhatsAppVendorInvite:`, error)
    return {
      success: false,
      error: error.message || 'Failed to send vendor invitation',
    }
  }
}

