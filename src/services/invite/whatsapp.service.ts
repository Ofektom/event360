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
  console.log(`📱 Formatting phone number: "${phone}"`)
  // Remove any non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  console.log(`📱 After cleaning: "${cleaned}"`)
  
  // If it doesn't start with +, add it (assuming default country code)
  if (!cleaned.startsWith('+')) {
    // You might want to add logic to detect country code
    // For now, we'll assume the number is already in correct format or add +1 for US
    cleaned = `+${cleaned}`
    console.log(`📱 Added + prefix: "${cleaned}"`)
  }
  
  console.log(`📱 Final formatted number: "${cleaned}"`)
  return cleaned
}

/**
 * Send WhatsApp invitation using SendZen API
 */
export async function sendWhatsAppInvite(
  params: SendWhatsAppInviteParams
): Promise<{ success: boolean; error?: string }> {
  const { to, inviteeName, eventTitle, invitationImageUrl, shareLink } = params
  const requestId = `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    console.log(`[${requestId}] 📱 WhatsApp Invite Request Started`)
    console.log(`[${requestId}] Parameters:`, {
      to,
      inviteeName,
      eventTitle,
      hasImage: !!invitationImageUrl,
      imageUrl: invitationImageUrl?.substring(0, 100) + '...',
      shareLink
    })

    // Check if SendZen is configured
    const apiKey = process.env.SENDZEN_API_KEY
    const apiUrl = process.env.SENDZEN_API_URL || 'https://api.sendzen.io'
    const phoneNumberId = process.env.SENDZEN_PHONE_NUMBER_ID

    console.log(`[${requestId}] 🔧 Configuration check:`)
    console.log(`[${requestId}]   - API Key: ${apiKey ? `✅ Present (${apiKey.substring(0, 10)}...)` : '❌ MISSING'}`)
    console.log(`[${requestId}]   - API URL: ${apiUrl}`)
    console.log(`[${requestId}]   - Phone Number ID: ${phoneNumberId ? `✅ ${phoneNumberId}` : '❌ MISSING'}`)
    console.log(`[${requestId}]   - NODE_ENV: ${process.env.NODE_ENV}`)

    // Development mode fallback
    if (!apiKey && process.env.NODE_ENV === 'development') {
      const message = `🎉 You're invited to ${eventTitle}!\n\nHi ${inviteeName}, you're invited to ${eventTitle}!\n\nClick the link to:\n• View your invitation\n• See event photos\n• Stream the event live\n\n${shareLink}`
      
      console.log(`[${requestId}] 📱 WhatsApp Invite (Dev Mode - SendZen not configured):`, {
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
      console.error(`[${requestId}] ❌ API Key not configured`)
      return {
        success: false,
        error: 'WhatsApp service not configured. Please set SENDZEN_API_KEY in environment variables.',
      }
    }

    if (!phoneNumberId) {
      console.error(`[${requestId}] ❌ Phone Number ID not configured`)
      return {
        success: false,
        error: 'WhatsApp phone number not configured. Please set SENDZEN_PHONE_NUMBER_ID in environment variables.',
      }
    }

    // Format phone number
    console.log(`[${requestId}] 📱 Formatting phone number...`)
    const formattedTo = formatPhoneNumber(to)
    console.log(`[${requestId}] ✅ Formatted: "${to}" → "${formattedTo}"`)

    // Create message content
    const messageText = `🎉 You're invited to ${eventTitle}!\n\nHi ${inviteeName}, you're invited to ${eventTitle}!\n\nClick the link to:\n• View your invitation\n• See event photos\n• Stream the event live\n\n${shareLink}`
    console.log(`[${requestId}] 📝 Message text length: ${messageText.length} characters`)

    // Prepare request body based on SendZen API format
    // SendZen uses WhatsApp Business API format
    const requestBody: any = {
      messaging_product: 'whatsapp',
      to: formattedTo,
      recipient_type: 'individual',
    }

    // If we have an image, send as media message with caption
    if (invitationImageUrl) {
      console.log(`[${requestId}] 🖼️  Preparing image message...`)
      requestBody.type = 'image'
      requestBody.image = {
        link: invitationImageUrl,
        caption: messageText,
      }
    } else {
      console.log(`[${requestId}] 📝 Preparing text message...`)
      // Send as text message
      requestBody.type = 'text'
      requestBody.text = {
        preview_url: false, // Set to true if you want link previews
        body: messageText,
      }
    }

    console.log(`[${requestId}] 📤 Request body prepared:`, {
      type: requestBody.type,
      to: requestBody.to,
      hasImage: !!requestBody.image,
      hasText: !!requestBody.text,
      imageLink: requestBody.image?.link?.substring(0, 100),
      textLength: requestBody.text?.body?.length
    })

    // Make API request to SendZen
    const apiEndpoint = `${apiUrl}/v1/messages`
    console.log(`[${requestId}] 🌐 Making API request to: ${apiEndpoint}`)
    console.log(`[${requestId}] 📤 Request details:`, {
      method: 'POST',
      url: apiEndpoint,
      headers: {
        'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
        'Content-Type': 'application/json',
      },
      bodySize: JSON.stringify(requestBody).length
    })

    const startTime = Date.now()
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    const duration = Date.now() - startTime

    console.log(`[${requestId}] 📥 Response received (${duration}ms):`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })

    let responseData: any
    try {
      const responseText = await response.text()
      console.log(`[${requestId}] 📥 Response body (raw):`, responseText)
      
      try {
        responseData = JSON.parse(responseText)
        console.log(`[${requestId}] 📥 Response body (parsed):`, JSON.stringify(responseData, null, 2))
      } catch (parseError) {
        console.error(`[${requestId}] ❌ Failed to parse response as JSON:`, parseError)
        responseData = { raw: responseText }
      }
    } catch (readError) {
      console.error(`[${requestId}] ❌ Failed to read response:`, readError)
      responseData = { error: 'Failed to read response' }
    }

    if (!response.ok) {
      console.error(`[${requestId}] ❌ SendZen API Error:`, {
        status: response.status,
        statusText: response.statusText,
        response: responseData
      })
      
      // Handle specific error cases
      if (response.status === 401) {
        console.error(`[${requestId}] ❌ Authentication failed - Invalid API key`)
        return {
          success: false,
          error: 'Invalid API key. Please check SENDZEN_API_KEY in environment variables.',
        }
      }
      
      if (response.status === 400) {
        console.error(`[${requestId}] ❌ Bad Request - Invalid request format`)
        const errorMessage = responseData?.error?.message || 
                           responseData?.message || 
                           responseData?.error ||
                           'Invalid request. Please check phone number format.'
        return {
          success: false,
          error: errorMessage,
        }
      }

      const errorMessage = responseData?.error?.message || 
                         responseData?.message || 
                         responseData?.error ||
                         `Failed to send WhatsApp message: ${response.statusText}`
      
      console.error(`[${requestId}] ❌ API Error (${response.status}):`, errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }

    console.log(`[${requestId}] ✅ WhatsApp message sent via SendZen successfully!`)
    console.log(`[${requestId}] Response data:`, JSON.stringify(responseData, null, 2))

    return { success: true }
  } catch (error: any) {
    console.error(`[${requestId}] ❌ Exception in sendWhatsAppInvite:`, error)
    console.error(`[${requestId}] Error name:`, error.name)
    console.error(`[${requestId}] Error message:`, error.message)
    console.error(`[${requestId}] Error stack:`, error.stack)
    console.error(`[${requestId}] Error code:`, error.code)
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error(`[${requestId}] ❌ Network error:`, error.code)
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

