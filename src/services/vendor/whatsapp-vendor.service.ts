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
    // SendZen 'from' field can be either:
    // 1. The actual phone number in E.164 format (e.g., +1234567890) - preferred
    // 2. A phone number ID (if SendZen supports it)
    const fromPhoneNumber = process.env.SENDZEN_PHONE_NUMBER || process.env.SENDZEN_PHONE_NUMBER_ID
    const phoneNumberId = process.env.SENDZEN_PHONE_NUMBER_ID // Keep for backward compatibility
    // Template configuration
    const templateName = process.env.SENDZEN_VENDOR_TEMPLATE_NAME || 'vendor_invitation'
    const templateLanguage = process.env.SENDZEN_TEMPLATE_LANGUAGE || 'en_US'
    const useTemplate = process.env.SENDZEN_USE_TEMPLATE !== 'false' // Default to true

    console.log(`[${requestId}] 🔧 Configuration check:`)
    console.log(`[${requestId}]   - API Key: ${apiKey ? `✅ Present (${apiKey.substring(0, 10)}...)` : '❌ MISSING'}`)
    console.log(`[${requestId}]   - API URL: ${apiUrl}`)
    console.log(`[${requestId}]   - From Phone Number: ${fromPhoneNumber ? `✅ ${fromPhoneNumber}` : '❌ MISSING'}`)
    console.log(`[${requestId}]   - Phone Number ID (legacy): ${phoneNumberId ? `✅ ${phoneNumberId}` : '❌ MISSING'}`)
    console.log(`[${requestId}]   - Template Name: ${templateName}`)
    console.log(`[${requestId}]   - Template Language: ${templateLanguage}`)
    console.log(`[${requestId}]   - Use Template: ${useTemplate}`)

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
      console.log(`[${requestId}] 📋 Preparing vendor invitation template message: ${templateName}`)
      
      requestBody.type = 'template'
      requestBody.template = {
        name: templateName,
        lang_code: templateLanguage, // SendZen expects 'lang_code' directly, not nested in 'language.code'
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
      // Fall back to regular message (works if user messaged you within 24 hours)
      console.log(`[${requestId}] 📝 Preparing regular vendor invitation message (template disabled or not configured)...`)
      requestBody.type = 'text'
      requestBody.text = {
        preview_url: true, // Enable link preview
        body: messageText,
      }
    }

    console.log(`[${requestId}] 📤 Request body prepared:`, {
      type: requestBody.type,
      to: requestBody.to,
      hasText: !!requestBody.text,
      hasTemplate: !!requestBody.template,
      templateName: requestBody.template?.name,
      textLength: requestBody.text?.body?.length,
      templateVariables: requestBody.template?.components?.find((c: any) => c.type === 'body')?.parameters?.map((p: any) => p.text?.substring(0, 30)),
    })

    // Make API request to SendZen
    // SendZen API format: POST https://api.sendzen.io/v1/messages
    // Documentation: https://www.sendzen.io/docs
    // Request body: { "from": "phone_number_id", "to": "recipient", "type": "text|template", ... }
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
        const errorDetails = responseData?.error || responseData
        console.error(`[${requestId}] ❌ Bad Request:`, errorDetails)
        
        // Check if it's a template-related error
        if (errorDetails?.message?.toLowerCase().includes('template') || 
            errorDetails?.code === 'TEMPLATE_NOT_FOUND' ||
            errorDetails?.code === 'TEMPLATE_NOT_APPROVED') {
          console.log(`[${requestId}] ⚠️ Template error detected, trying regular message fallback...`)
          
          // Fall back to regular message
          const fallbackBody = {
            from: formattedFrom,
            to: formattedTo,
            type: 'text',
            text: {
              preview_url: true,
              body: messageText,
            },
          }

          console.log(`[${requestId}] 📤 Fallback request body:`, JSON.stringify(fallbackBody, null, 2))

          const retryResponse = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fallbackBody),
          })

          const retryDuration = Date.now() - startTime
          console.log(`[${requestId}] 📥 Fallback response received (${retryDuration}ms):`, {
            status: retryResponse.status,
            statusText: retryResponse.statusText,
            ok: retryResponse.ok,
          })

          if (retryResponse.ok) {
            console.log(`[${requestId}] ✅ Fallback message sent successfully`)
            return { success: true }
          } else {
            const retryData = await retryResponse.json().catch(() => ({}))
            console.error(`[${requestId}] ❌ Fallback also failed:`, retryData)
          }
        }
      }
      
      const errorMessage = responseData?.error?.message || 
                         responseData?.message || 
                         responseData?.error ||
                         'Failed to send WhatsApp message'
      return {
        success: false,
        error: errorMessage,
      }
    }

    console.log(`[${requestId}] ✅ Vendor WhatsApp invitation sent successfully!`)
    console.log(`[${requestId}] 📊 Response data:`, responseData)
    return { success: true }
  } catch (error: any) {
    console.error(`[${requestId}] ❌ Exception in sendWhatsAppVendorInvite:`, error)
    return {
      success: false,
      error: error.message || 'Failed to send vendor invitation',
    }
  }
}

