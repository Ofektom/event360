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
 * 
 * IMPORTANT: WhatsApp Business API Limitations
 * - For first-time messages, you must use an approved message template
 * - Regular messages only work if the user messaged you within the last 24 hours
 * - To send to new contacts, create and approve a message template in WhatsApp Business Manager
 * - Template messages must be approved by WhatsApp before use
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
 * Ensures it includes country code and is in E.164 format (+[country code][number])
 */
function formatPhoneNumber(phone: string): string {
  console.log(`📱 Formatting phone number: "${phone}"`)
  
  if (!phone || phone.trim().length === 0) {
    throw new Error('Phone number is required')
  }
  
  // Remove any non-digit characters except +
  let cleaned = phone.trim().replace(/[^\d+]/g, '')
  console.log(`📱 After cleaning: "${cleaned}"`)
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '')
  
  // If it doesn't start with +, we need to add country code
  if (!cleaned.startsWith('+')) {
    // Try to detect country code from common patterns
    // If it starts with 1 and is 11 digits, it's likely US/Canada (+1)
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = `+${cleaned}`
    }
    // If it's 10 digits, assume US/Canada (+1)
    else if (cleaned.length === 10) {
      cleaned = `+1${cleaned}`
    }
    // If it's 9-15 digits, assume it needs a country code (default to +1 for US)
    // In production, you might want to use a library like libphonenumber-js
    else if (cleaned.length >= 9 && cleaned.length <= 15) {
      // For now, default to +1 (US/Canada)
      // TODO: Add country code detection or require users to include country code
      cleaned = `+1${cleaned}`
      console.log(`📱 ⚠️ Assuming US/Canada country code (+1). For other countries, please include country code.`)
    }
    // If it's already in a format we don't recognize, just add +
    else {
      cleaned = `+${cleaned}`
    }
    console.log(`📱 Added country code: "${cleaned}"`)
  }
  
  // Validate E.164 format: + followed by 1-15 digits
  const e164Pattern = /^\+[1-9]\d{1,14}$/
  if (!e164Pattern.test(cleaned)) {
    console.warn(`📱 ⚠️ Phone number "${cleaned}" may not be in valid E.164 format`)
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
    // SendZen 'from' field can be either:
    // 1. The actual phone number in E.164 format (e.g., +1234567890) - preferred
    // 2. A phone number ID (if SendZen supports it)
    const fromPhoneNumber = process.env.SENDZEN_PHONE_NUMBER || process.env.SENDZEN_PHONE_NUMBER_ID
    const phoneNumberId = process.env.SENDZEN_PHONE_NUMBER_ID // Keep for backward compatibility
    // Template configuration
    const templateName = process.env.SENDZEN_TEMPLATE_NAME || 'event_invitation'
    const templateLanguage = process.env.SENDZEN_TEMPLATE_LANGUAGE || 'en_US'
    const useTemplate = process.env.SENDZEN_USE_TEMPLATE !== 'false' // Default to true

    console.log(`[${requestId}] 🔧 Configuration check:`)
    console.log(`[${requestId}]   - API Key: ${apiKey ? `✅ Present (${apiKey.substring(0, 10)}...)` : '❌ MISSING'}`)
    console.log(`[${requestId}]   - API URL: ${apiUrl}`)
    console.log(`[${requestId}]   - From Phone Number: ${fromPhoneNumber ? `✅ ${fromPhoneNumber}` : '❌ MISSING'}`)
    console.log(`[${requestId}]   - Phone Number ID (legacy): ${phoneNumberId ? `✅ ${phoneNumberId}` : '❌ MISSING'}`)
    console.log(`[${requestId}]   - Template Name: ${templateName}`)
    console.log(`[${requestId}]   - Template Language: ${templateLanguage}`)
    console.log(`[${requestId}]   - Use Template: ${useTemplate ? '✅ Yes' : '❌ No'}`)
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

    if (!fromPhoneNumber) {
      console.error(`[${requestId}] ❌ Phone Number not configured`)
      return {
        success: false,
        error: 'WhatsApp phone number not configured. Please set SENDZEN_PHONE_NUMBER (E.164 format, e.g., +1234567890) or SENDZEN_PHONE_NUMBER_ID in environment variables.',
      }
    }

    // Ensure the 'from' phone number is in E.164 format
    let formattedFrom: string
    try {
      formattedFrom = formatPhoneNumber(fromPhoneNumber)
      console.log(`[${requestId}] ✅ Formatted 'from' number: "${fromPhoneNumber}" → "${formattedFrom}"`)
    } catch (formatError: any) {
      console.error(`[${requestId}] ❌ 'From' phone number formatting error:`, formatError.message)
      return {
        success: false,
        error: `Invalid 'from' phone number format: ${formatError.message}. Please ensure SENDZEN_PHONE_NUMBER is in E.164 format (e.g., +1234567890).`,
      }
    }

    // Format phone number
    console.log(`[${requestId}] 📱 Formatting phone number...`)
    let formattedTo: string
    try {
      formattedTo = formatPhoneNumber(to)
      console.log(`[${requestId}] ✅ Formatted: "${to}" → "${formattedTo}"`)
    } catch (formatError: any) {
      console.error(`[${requestId}] ❌ Phone number formatting error:`, formatError.message)
      return {
        success: false,
        error: `Invalid phone number: ${formatError.message}`,
      }
    }

    // Create message content
    const messageText = `🎉 You're invited to ${eventTitle}!\n\nHi ${inviteeName}, you're invited to ${eventTitle}!\n\nClick the link to:\n• View your invitation\n• See event photos\n• Stream the event live\n\n${shareLink}`
    console.log(`[${requestId}] 📝 Message text length: ${messageText.length} characters`)

    // Convert relative URLs to absolute URLs for WhatsApp
    let imageUrl: string | null = null
    if (invitationImageUrl) {
      imageUrl = invitationImageUrl
      if (imageUrl.startsWith('/')) {
        // Relative URL - convert to absolute
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       process.env.NEXTAUTH_URL || 
                       'https://event360-three.vercel.app'
        imageUrl = `${baseUrl}${imageUrl}`
        console.log(`[${requestId}] 🔗 Converted relative URL to absolute: ${imageUrl}`)
      } else if (imageUrl.startsWith('data:')) {
        // Data URL - WhatsApp doesn't support data URLs directly
        // We'll skip the image and send text only
        console.warn(`[${requestId}] ⚠️ Data URL detected. WhatsApp requires absolute URLs. Skipping image.`)
        imageUrl = null
      } else {
        // Already absolute URL
        console.log(`[${requestId}] ✅ Using absolute URL: ${imageUrl.substring(0, 100)}...`)
      }
    }

    // Prepare request body based on SendZen API format
    // SendZen API format: https://www.sendzen.io/docs
    // Endpoint: POST /v1/messages
    // We'll try template message first (for new contacts), then fall back to regular message
    let requestBody: any = {
      from: formattedFrom, // SendZen 'from' field should be the phone number in E.164 format
      to: formattedTo,
    }

    // Try template message first if enabled
    if (useTemplate && templateName) {
      console.log(`[${requestId}] 📋 Preparing template message: ${templateName}`)
      
      requestBody.type = 'template'
      requestBody.template = {
        name: templateName,
        language: {
          code: templateLanguage,
        },
        components: [],
      }

      // Add header component if we have an image
      if (imageUrl) {
        console.log(`[${requestId}] 🖼️  Adding image header to template...`)
        requestBody.template.components.push({
          type: 'header',
          parameters: [
            {
              type: 'image',
              image: {
                link: imageUrl,
              },
            },
          ],
        })
      }

      // Add body component with variables
      // Template variables: {{1}} = eventTitle, {{2}} = inviteeName, {{3}} = shareLink
      requestBody.template.components.push({
        type: 'body',
        parameters: [
          {
            type: 'text',
            text: eventTitle,
          },
          {
            type: 'text',
            text: inviteeName,
          },
          {
            type: 'text',
            text: shareLink,
          },
        ],
      })

      console.log(`[${requestId}] 📋 Template message prepared with variables:`, {
        '{{1}}': eventTitle,
        '{{2}}': inviteeName,
        '{{3}}': shareLink,
        hasImageHeader: !!imageUrl,
      })
    } else {
      // Fall back to regular message (works if user messaged you within 24 hours)
      console.log(`[${requestId}] 📝 Preparing regular message (template disabled or not configured)...`)
      
      // If we have a valid image URL, send as media message with caption
      if (imageUrl) {
        console.log(`[${requestId}] 🖼️  Preparing image message...`)
        requestBody.type = 'image'
        requestBody.image = {
          link: imageUrl,
          caption: messageText.substring(0, 1024), // WhatsApp caption limit is 1024 characters
        }
      } else {
        console.log(`[${requestId}] 📝 Preparing text message...`)
        // Send as text message with link preview
        requestBody.type = 'text'
        requestBody.text = {
          preview_url: true, // Enable link preview
          body: messageText,
        }
      }
    }

    console.log(`[${requestId}] 📤 Request body prepared:`, {
      type: requestBody.type,
      to: requestBody.to,
      hasImage: !!requestBody.image,
      hasText: !!requestBody.text,
      hasTemplate: !!requestBody.template,
      templateName: requestBody.template?.name,
      imageLink: requestBody.image?.link?.substring(0, 100) || requestBody.template?.components?.[0]?.parameters?.[0]?.image?.link?.substring(0, 100),
      textLength: requestBody.text?.body?.length,
      templateVariables: requestBody.template?.components?.find((c: any) => c.type === 'body')?.parameters?.map((p: any) => p.text?.substring(0, 30)),
    })

    // Make API request to SendZen
    // SendZen API format: POST https://api.sendzen.io/v1/messages
    // Documentation: https://www.sendzen.io/docs
    // Request body: { "from": "phone_number_id", "to": "recipient", "type": "text|image", ... }
    const apiEndpoint = `${apiUrl}/v1/messages`
    
    console.log(`[${requestId}] 🌐 Making API request to: ${apiEndpoint}`)
    console.log(`[${requestId}] 📤 Request details:`, {
      method: 'POST',
      url: apiEndpoint,
      headers: {
        'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody, null, 2),
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
        
        // Check for specific WhatsApp Business API errors
        const errorCode = responseData?.error?.code || responseData?.error?.subcode
        
        // If template message fails, try regular message as fallback
        if (useTemplate && requestBody.type === 'template' && (errorCode === 131047 || errorMessage.includes('cannot be delivered') || errorMessage.includes('template') || errorMessage.includes('not found') || errorMessage.includes('not approved'))) {
          console.log(`[${requestId}] ⚠️ Template message failed, trying regular message as fallback...`)
          console.log(`[${requestId}] ⚠️ Error: ${errorMessage}`)
          
          // Retry with regular message
          const fallbackBody: any = {
            from: formattedFrom,
            to: formattedTo,
          }

          if (imageUrl) {
            fallbackBody.type = 'image'
            fallbackBody.image = {
              link: imageUrl,
              caption: messageText.substring(0, 1024),
            }
          } else {
            fallbackBody.type = 'text'
            fallbackBody.text = {
              preview_url: true,
              body: messageText,
            }
          }

          console.log(`[${requestId}] 🔄 Retrying with regular message...`)
          const retryResponse = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fallbackBody),
          })

          if (retryResponse.ok) {
            const retryData = await retryResponse.json()
            console.log(`[${requestId}] ✅ Fallback regular message sent successfully`)
            return { success: true }
          } else {
            const retryErrorData = await retryResponse.json().catch(() => ({}))
            const retryErrorMessage = retryErrorData?.error?.message || retryErrorData?.message || 'Failed to send message'
            console.error(`[${requestId}] ❌ Fallback regular message also failed:`, retryErrorMessage)
            // Continue to return the original error
          }
        }
        
        if (errorCode === 131047 || errorMessage.includes('cannot be delivered')) {
          return {
            success: false,
            error: 'Message cannot be delivered at this time. This is a WhatsApp Business API limitation. Solutions: (1) Have the recipient message your WhatsApp Business number first (then you can reply within 24 hours), or (2) Ensure your message template is approved and configured correctly. See WHATSAPP_MESSAGING_LIMITATIONS.md for detailed instructions.',
          }
        }
        
        // Handle "Invalid 'From' Phone Number" error specifically
        if (errorMessage.includes('Invalid') && errorMessage.includes('From') && errorMessage.includes('Phone')) {
          return {
            success: false,
            error: `Invalid 'From' Phone Number: ${errorMessage}. Please ensure SENDZEN_PHONE_NUMBER is set to your actual WhatsApp Business phone number in E.164 format (e.g., +1234567890). The number must be registered and verified in your SendZen account. Full error: ${JSON.stringify(responseData)}`,
          }
        }
        
        // Handle "message_id is required" error specifically
        if (errorMessage.includes('message_id')) {
          return {
            success: false,
            error: `SendZen API Error: ${errorMessage}. This may indicate that SendZen requires a different API format or that you need to use message templates. Please check SendZen documentation or contact SendZen support. Full error: ${JSON.stringify(responseData)}`,
          }
        }
        
        return {
          success: false,
          error: errorMessage,
        }
      }

      // Handle 403 - Forbidden (common for WhatsApp Business API)
      if (response.status === 403) {
        const errorMessage = responseData?.error?.message || 
                           responseData?.message || 
                           'Access forbidden. Check API permissions and phone number configuration.'
        console.error(`[${requestId}] ❌ Forbidden:`, errorMessage)
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
      console.error(`[${requestId}] Full error response:`, JSON.stringify(responseData, null, 2))
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

