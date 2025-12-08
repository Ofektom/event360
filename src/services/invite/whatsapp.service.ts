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
    // Nigerian numbers: typically 10 digits starting with 0, or 9 digits after removing 0
    // After removing leading 0, if it's 9 digits and starts with 7, 8, or 9, it's likely Nigeria (+234)
    if (cleaned.length === 9 && /^[789]/.test(cleaned)) {
      cleaned = `+234${cleaned}`
      console.log(`📱 Detected Nigerian number, added +234 country code`)
    }
    // If it starts with 234 and is 12-13 digits, it's already a Nigerian number without +
    else if (cleaned.length >= 12 && cleaned.length <= 13 && cleaned.startsWith('234')) {
      cleaned = `+${cleaned}`
      console.log(`📱 Detected Nigerian number with country code, added +`)
    }
    // If it starts with 1 and is 11 digits, it's likely US/Canada (+1)
    else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = `+${cleaned}`
    }
    // If it's 10 digits, assume US/Canada (+1)
    else if (cleaned.length === 10) {
      cleaned = `+1${cleaned}`
      console.log(`📱 Assuming US/Canada country code (+1)`)
    }
    // If it's 9-15 digits, assume it needs a country code
    // Default to +234 for Nigeria (most common use case), but warn user
    else if (cleaned.length >= 9 && cleaned.length <= 15) {
      // Default to +234 (Nigeria) as it's the most common use case
      cleaned = `+234${cleaned}`
      console.log(`📱 ⚠️ Assuming Nigerian country code (+234). For other countries, please include country code.`)
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
    let templateLanguage = (process.env.SENDZEN_TEMPLATE_LANGUAGE || 'en').trim().toLowerCase() // SendZen expects lowercase (e.g., "en" not "en_US")
    
    // Convert locale format (en_US) to language code (en) if needed
    if (templateLanguage.includes('_')) {
      templateLanguage = templateLanguage.split('_')[0]
      console.log(`[${requestId}] ℹ️ Converted locale to language code: "${templateLanguage}"`)
    }
    
    const useTemplate = process.env.SENDZEN_USE_TEMPLATE !== 'false' // Default to true
    
    // Validate template language code
    if (!templateLanguage || templateLanguage.length === 0) {
      console.error(`[${requestId}] ❌ Template language code is empty or invalid: "${templateLanguage}"`)
      return {
        success: false,
        error: 'Template language code is required. Please set SENDZEN_TEMPLATE_LANGUAGE environment variable (e.g., "en" or "en_US" - will be converted to "en").',
      }
    }

    console.log(`[${requestId}] 🔧 Configuration check:`)
    console.log(`[${requestId}]   - API Key: ${apiKey ? `✅ Present (${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)})` : '❌ MISSING'}`)
    console.log(`[${requestId}]   - API URL: ${apiUrl}`)
    console.log(`[${requestId}]   - From Phone Number: ${fromPhoneNumber ? `✅ ${fromPhoneNumber}` : '❌ MISSING'}`)
    console.log(`[${requestId}]   - Phone Number ID: ${phoneNumberId ? `✅ ${phoneNumberId}` : '❌ MISSING'}`)
    console.log(`[${requestId}]   - Template Name: ${templateName}`)
    console.log(`[${requestId}]   - Template Language: ${templateLanguage}`)
    console.log(`[${requestId}]   - Use Template: ${useTemplate ? '✅ Yes' : '❌ No'}`)
    console.log(`[${requestId}]   - NODE_ENV: ${process.env.NODE_ENV}`)
    console.log(`[${requestId}]   - Invitation Image URL: ${invitationImageUrl ? `✅ Present (${invitationImageUrl.substring(0, 80)}...)` : '❌ MISSING'}`)
    console.log(`[${requestId}]   - Share Link: ${shareLink}`)

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

    // Check if either phone number or phone number ID is configured
    if (!fromPhoneNumber && !phoneNumberId) {
      console.error(`[${requestId}] ❌ Phone Number not configured`)
      return {
        success: false,
        error: 'WhatsApp phone number not configured. Please set SENDZEN_PHONE_NUMBER (E.164 format, e.g., +1234567890) or SENDZEN_PHONE_NUMBER_ID in environment variables.',
      }
    }
    
    // Log which one we'll use (actual phone number is prioritized over ID)
    if (fromPhoneNumber) {
      console.log(`[${requestId}] ✅ Phone Number found: ${fromPhoneNumber} (will format and use for 'from' field - SendZen requires actual phone number)`)
    } else if (phoneNumberId) {
      console.log(`[${requestId}] ⚠️ Phone Number ID found: ${phoneNumberId.substring(0, 10)}... (will use as fallback, but SendZen may reject it - consider setting SENDZEN_PHONE_NUMBER)`)
    }

    // Ensure the 'from' phone number is in E.164 format
    // SendZen requires the actual phone number in E.164 format, not the phone number ID
    // Priority: 1) Actual phone number (SENDZEN_PHONE_NUMBER), 2) Phone number ID (SENDZEN_PHONE_NUMBER_ID) as fallback
    let formattedFrom: string
    try {
      // Prefer actual phone number if available (SendZen requires this)
      if (fromPhoneNumber && fromPhoneNumber.trim().length > 0 && !fromPhoneNumber.match(/^\d+$/)) {
        // If it looks like a phone number (not just digits), format it
        formattedFrom = formatPhoneNumber(fromPhoneNumber)
        console.log(`[${requestId}] ✅ Using formatted phone number as 'from': "${fromPhoneNumber}" → "${formattedFrom}"`)
      } else if (fromPhoneNumber && fromPhoneNumber.trim().length > 0) {
        // If it's already in a format we can use, use it directly
        formattedFrom = fromPhoneNumber.trim()
        // Ensure it starts with +
        if (!formattedFrom.startsWith('+')) {
          formattedFrom = formatPhoneNumber(formattedFrom)
        }
        console.log(`[${requestId}] ✅ Using phone number as 'from': "${formattedFrom}"`)
      } else if (phoneNumberId && phoneNumberId.trim().length > 0) {
        // Fallback to phone number ID if no actual phone number is available
        formattedFrom = phoneNumberId.trim()
        console.log(`[${requestId}] ⚠️ Using phone number ID as 'from' (fallback): "${formattedFrom}"`)
        console.log(`[${requestId}] ⚠️ Note: SendZen may require the actual phone number. Consider setting SENDZEN_PHONE_NUMBER.`)
      } else {
        // Neither is available
        console.error(`[${requestId}] ❌ Neither phone number nor phone number ID is available`)
        return {
          success: false,
          error: 'Phone number not configured. Please set SENDZEN_PHONE_NUMBER (E.164 format, e.g., +2348012345678) in environment variables.',
        }
      }
      
      // Validate the formatted number if it's not a phone number ID (which is just digits)
      if (!/^\d+$/.test(formattedFrom)) {
        
        // Validate E.164 format: should be + followed by 1-15 digits
        const e164Pattern = /^\+[1-9]\d{1,14}$/
        if (!e164Pattern.test(formattedFrom)) {
          console.error(`[${requestId}] ❌ 'From' number "${formattedFrom}" is not in valid E.164 format (length: ${formattedFrom.length})`)
          return {
            success: false,
            error: `Invalid 'from' phone number format: "${formattedFrom}". Phone number must be in E.164 format (e.g., +1234567890 or +2348012345678). Current length: ${formattedFrom.length} characters. Please set SENDZEN_PHONE_NUMBER_ID if you have a phone number ID from SendZen.`,
          }
        }
        
        // Check length - E.164 should be 7-15 digits after the +
        const digitsAfterPlus = formattedFrom.substring(1)
        if (digitsAfterPlus.length < 7 || digitsAfterPlus.length > 15) {
          console.error(`[${requestId}] ❌ 'From' number has invalid length: ${digitsAfterPlus.length} digits (should be 7-15)`)
          return {
            success: false,
            error: `'From' phone number has invalid length: ${digitsAfterPlus.length} digits. E.164 format requires 7-15 digits after the country code (e.g., +1234567890 has 10 digits). Please check your phone number format or use SENDZEN_PHONE_NUMBER_ID.`,
          }
        }
      } else {
        // Neither phoneNumberId nor fromPhoneNumber is available
        console.error(`[${requestId}] ❌ Neither phone number ID nor phone number is available`)
        return {
          success: false,
          error: 'Phone number not configured. Please set either SENDZEN_PHONE_NUMBER (E.164 format) or SENDZEN_PHONE_NUMBER_ID in environment variables.',
        }
      }
    } catch (formatError: any) {
      console.error(`[${requestId}] ❌ 'From' phone number formatting error:`, formatError.message)
      return {
        success: false,
        error: `Invalid 'from' phone number format: ${formatError.message}. Please ensure SENDZEN_PHONE_NUMBER is in E.164 format (e.g., +1234567890) or set SENDZEN_PHONE_NUMBER_ID.`,
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
        const { getBaseUrl } = await import('@/lib/utils')
        const baseUrl = getBaseUrl()
        imageUrl = `${baseUrl}${imageUrl}`
        console.log(`[${requestId}] 🔗 Converted relative URL to absolute: ${imageUrl}`)
      } else if (imageUrl.startsWith('data:')) {
        // Data URL - Should have been converted to absolute URL in the API route
        // If we still see a data URL here, skip it
        console.warn(`[${requestId}] ⚠️ Data URL detected in WhatsApp service. This should have been converted earlier. Skipping image.`)
        imageUrl = null
      } else {
        // Already absolute URL - validate it
        try {
          const url = new URL(imageUrl)
          // Validate URL format
          if (!url.protocol.startsWith('http')) {
            console.error(`[${requestId}] ❌ Invalid URL protocol: ${url.protocol}. Must be http:// or https://`)
            imageUrl = null
          } else {
            console.log(`[${requestId}] ✅ Using absolute URL: ${imageUrl.substring(0, 150)}...`)
            console.log(`[${requestId}] 📏 URL length: ${imageUrl.length} characters`)
            
            // Check if URL is too long (SendZen might have limits)
            if (imageUrl.length > 2048) {
              console.warn(`[${requestId}] ⚠️ URL is very long (${imageUrl.length} chars). SendZen might reject it.`)
            }
          }
        } catch (urlError: any) {
          console.error(`[${requestId}] ❌ Invalid URL format: ${imageUrl ? imageUrl.substring(0, 100) : 'null'}... Error: ${urlError.message}`)
          imageUrl = null
        }
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
        lang_code: templateLanguage, // SendZen expects 'lang_code' in lowercase (e.g., "en" not "en_US")
        components: [],
      }
      
      // Validate template structure before sending
      if (!requestBody.template.lang_code || requestBody.template.lang_code.trim().length === 0) {
        console.error(`[${requestId}] ❌ Template lang_code is empty or invalid: "${requestBody.template.lang_code}"`)
        return {
          success: false,
          error: `Template language code is required. Current value: "${requestBody.template.lang_code}". Please set SENDZEN_TEMPLATE_LANGUAGE environment variable (e.g., "en" or "en_US" - will be converted to "en").`,
        }
      }
      
      console.log(`[${requestId}] ✅ Template structure validated:`, {
        name: requestBody.template.name,
        lang_code: requestBody.template.lang_code,
        lang_codeLength: requestBody.template.lang_code.length,
        componentsCount: requestBody.template.components.length
      })

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
      // Template variables: {{1}} = inviteeName, {{2}} = eventTitle, {{3}} = shareLink
      // Template text: "Hi {{1}}, you're cordially invited to {{2}}! ... {{3}}"
      requestBody.template.components.push({
        type: 'body',
        parameters: [
          {
            type: 'text',
            text: inviteeName, // {{1}} - Invitee Name
          },
          {
            type: 'text',
            text: eventTitle, // {{2}} - Event Title
          },
          {
            type: 'text',
            text: shareLink, // {{3}} - Share Link
          },
        ],
      })

      console.log(`[${requestId}] 📋 Template message prepared with variables:`, {
        '{{1}}': inviteeName,
        '{{2}}': eventTitle,
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
      from: requestBody.from,
      to: requestBody.to,
      hasImage: !!requestBody.image,
      hasText: !!requestBody.text,
      hasTemplate: !!requestBody.template,
      templateName: requestBody.template?.name,
      templateLanguage: requestBody.template?.lang_code,
      imageLink: requestBody.image?.link?.substring(0, 100) || requestBody.template?.components?.[0]?.parameters?.[0]?.image?.link?.substring(0, 100),
      textLength: requestBody.text?.body?.length,
      templateVariables: requestBody.template?.components?.find((c: any) => c.type === 'body')?.parameters?.map((p: any) => p.text?.substring(0, 30)),
      templateComponents: requestBody.template?.components?.map((c: any) => ({
        type: c.type,
        parametersCount: c.parameters?.length || 0
      }))
    })

    // Log the full request body for debugging
    const requestBodyString = JSON.stringify(requestBody, null, 2)
    console.log(`[${requestId}] 📤 Full Request Body:`, requestBodyString)
    console.log(`[${requestId}] 📤 Request Body Size: ${requestBodyString.length} bytes`)
    
    // Log configuration summary
    console.log(`[${requestId}] ⚙️ SendZen Configuration Summary:`)
    console.log(`[${requestId}]   - API URL: ${apiUrl}`)
    console.log(`[${requestId}]   - API Key: ${apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : 'NOT SET'}`)
    console.log(`[${requestId}]   - From Phone: ${formattedFrom}`)
    console.log(`[${requestId}]   - To Phone: ${formattedTo}`)
    console.log(`[${requestId}]   - Message Type: ${requestBody.type}`)
    console.log(`[${requestId}]   - Using Template: ${useTemplate ? 'Yes' : 'No'}`)
    if (useTemplate) {
      console.log(`[${requestId}]   - Template Name: ${templateName}`)
      console.log(`[${requestId}]   - Template Language: ${templateLanguage}`)
    }
    console.log(`[${requestId}]   - Has Image: ${!!imageUrl}`)
    if (imageUrl) {
      console.log(`[${requestId}]   - Image URL: ${imageUrl.substring(0, 150)}${imageUrl.length > 150 ? '...' : ''}`)
      console.log(`[${requestId}]   - Image URL Length: ${imageUrl.length} characters`)
      console.log(`[${requestId}]   - Image URL Valid: ${imageUrl.startsWith('http') ? 'Yes (HTTPS/HTTP)' : imageUrl.startsWith('data:') ? 'No (Data URL)' : 'Unknown'}`)
    }

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
      bodySize: requestBodyString.length
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
    let responseText: string = ''
    try {
      responseText = await response.text()
      console.log(`[${requestId}] 📥 Response body (raw):`, responseText)
      console.log(`[${requestId}] 📥 Response body length:`, responseText.length)
      
      // Try to parse as JSON
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          responseData = JSON.parse(responseText)
          console.log(`[${requestId}] 📥 Response body (parsed JSON):`, JSON.stringify(responseData, null, 2))
        } catch (parseError: any) {
          console.error(`[${requestId}] ❌ Failed to parse response as JSON:`, parseError.message)
          console.error(`[${requestId}] ❌ Response text that failed to parse:`, responseText.substring(0, 500))
          responseData = { 
            raw: responseText,
            parseError: parseError.message 
          }
        }
      } else {
        // Not JSON, treat as plain text error
        console.log(`[${requestId}] 📥 Response is not JSON, treating as text error`)
        responseData = { 
          error: responseText,
          message: responseText,
          raw: responseText
        }
      }
    } catch (readError: any) {
      console.error(`[${requestId}] ❌ Failed to read response:`, readError.message)
      console.error(`[${requestId}] ❌ Read error stack:`, readError.stack)
      responseData = { 
        error: 'Failed to read response',
        readError: readError.message 
      }
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
        console.error(`[${requestId}] ❌ Bad Request (400) - Invalid request format`)
        console.error(`[${requestId}] ❌ Response Status: ${response.status} ${response.statusText}`)
        console.error(`[${requestId}] ❌ Response Headers:`, Object.fromEntries(response.headers.entries()))
        
        // Extract error details more thoroughly - try multiple paths
        const errorDetails = responseData?.error || 
                            responseData?.data?.error || 
                            responseData?.errors || 
                            responseData
        
        // Try to extract error message from multiple possible locations
        let errorMessage = errorDetails?.message || 
                          responseData?.message || 
                          errorDetails?.error?.message ||
                          errorDetails?.title ||
                          errorDetails?.detail ||
                          (typeof errorDetails === 'string' ? errorDetails : null) ||
                          (typeof responseData === 'string' ? responseData : null) ||
                          'Invalid request. Please check phone number format.'
        
        // If errorMessage is still generic, try to extract from raw response
        if (errorMessage === 'One or more validation errors occurred.' || errorMessage.includes('validation')) {
          // Try to find more specific error details
          if (responseData?.errors) {
            errorMessage = `Validation errors: ${JSON.stringify(responseData.errors)}`
          } else if (responseData?.error?.errors) {
            errorMessage = `Validation errors: ${JSON.stringify(responseData.error.errors)}`
          } else if (responseText) {
            // Try to extract from raw text
            errorMessage = `Validation error. Raw response: ${responseText.substring(0, 500)}`
          }
        }
        
        // Extract validation errors if present - check multiple possible locations
        const validationErrors = responseData?.errors ||
                                responseData?.error?.errors ||
                                errorDetails?.errors || 
                                errorDetails?.validation_errors || 
                                errorDetails?.details ||
                                errorDetails?.validationErrors ||
                                responseData?.validation_errors ||
                                (Array.isArray(errorDetails) ? errorDetails : null) ||
                                (Array.isArray(responseData) ? responseData : null)
        
        // Log full error details
        console.error(`[${requestId}] ❌ Full Error Response Object:`, JSON.stringify(responseData, null, 2))
        console.error(`[${requestId}] ❌ Raw Response Text:`, responseText)
        if (validationErrors) {
          console.error(`[${requestId}] ❌ Validation Errors Found:`, JSON.stringify(validationErrors, null, 2))
        } else {
          console.error(`[${requestId}] ⚠️ No validation errors array found in response`)
        }
        
        // Build detailed error message
        let detailedErrorMessage = errorMessage
        if (validationErrors) {
          if (Array.isArray(validationErrors)) {
            const errorList = validationErrors.map(e => {
              if (typeof e === 'string') return e
              if (e?.field && e?.message) return `${e.field}: ${e.message}`
              if (e?.property && e?.message) return `${e.property}: ${e.message}`
              return JSON.stringify(e)
            }).join('\n')
            detailedErrorMessage = `Validation errors:\n${errorList}`
          } else if (typeof validationErrors === 'object') {
            const errorList = Object.entries(validationErrors)
              .map(([key, value]) => {
                if (Array.isArray(value)) {
                  return `${key}: ${value.join(', ')}`
                }
                return `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`
              })
              .join('\n')
            detailedErrorMessage = `Validation errors:\n${errorList}`
          } else {
            detailedErrorMessage = `Validation errors: ${validationErrors}`
          }
        } else if (responseText && responseText.length > 0) {
          // If no structured errors, include raw response
          detailedErrorMessage = `${errorMessage}\n\nRaw response: ${responseText.substring(0, 1000)}`
        }
        
        // Check for specific WhatsApp Business API errors
        const errorCode = errorDetails?.code || 
                         errorDetails?.subcode || 
                         responseData?.error?.code || 
                         responseData?.error?.subcode ||
                         responseData?.code
        
        // If template message fails, try regular message as fallback
        if (useTemplate && requestBody.type === 'template' && (errorCode === 131047 || errorMessage.toLowerCase().includes('cannot be delivered') || errorMessage.toLowerCase().includes('template') || errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('not approved') || errorMessage.toLowerCase().includes('validation'))) {
          console.log(`[${requestId}] ⚠️ Template message failed, trying regular message as fallback...`)
          console.log(`[${requestId}] ⚠️ Error: ${detailedErrorMessage}`)
          
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
        
        // Return detailed error message with validation errors if available
        return {
          success: false,
          error: detailedErrorMessage,
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

    // Validate that SendZen actually accepted the message
    // Even with 200 OK, SendZen might return errors in the response body
    console.log(`[${requestId}] 🔍 Validating SendZen response body...`)
    console.log(`[${requestId}] Response status: ${response.status} ${response.statusText}`)
    console.log(`[${requestId}] Response OK: ${response.ok}`)
    console.log(`[${requestId}] Response data type: ${typeof responseData}`)
    console.log(`[${requestId}] Response data keys: ${responseData ? Object.keys(responseData).join(', ') : 'null'}`)
    
    if (response.ok && responseData) {
      // Check for errors in response body (even with 200 status)
      if (responseData.error || responseData.errors) {
        const errorDetails = responseData.error || responseData.errors
        console.error(`[${requestId}] ❌ SendZen returned error in response body despite 200 status:`)
        console.error(`[${requestId}] Error details:`, JSON.stringify(errorDetails, null, 2))
        return {
          success: false,
          error: `SendZen error in response: ${JSON.stringify(errorDetails)}`,
        }
      }

      // Extract message ID and status from various possible response formats
      const messageId = responseData.message_id || 
                       responseData.id || 
                       responseData.messages?.[0]?.id ||
                       responseData.data?.message_id ||
                       responseData.data?.id ||
                       responseData.result?.message_id ||
                       responseData.result?.id
      
      const status = responseData.status || 
                    responseData.messages?.[0]?.status ||
                    responseData.data?.status ||
                    responseData.result?.status
      
      const wamid = responseData.messages?.[0]?.wamid || 
                   responseData.wamid ||
                   responseData.data?.wamid ||
                   responseData.result?.wamid

      // Log message identifiers
      if (messageId) {
        console.log(`[${requestId}] ✅ Message ID found: ${messageId}`)
      } else {
        console.warn(`[${requestId}] ⚠️ No message ID found in response`)
      }

      if (wamid) {
        console.log(`[${requestId}] ✅ WhatsApp Message ID (wamid): ${wamid}`)
      } else {
        console.warn(`[${requestId}] ⚠️ No WhatsApp Message ID (wamid) found in response`)
      }

      if (status) {
        console.log(`[${requestId}] 📊 Message status: ${status}`)
        
        // Check if status indicates pending/queued (might still be processing)
        const statusLower = status.toLowerCase()
        if (['pending', 'queued', 'accepted', 'processing'].includes(statusLower)) {
          console.log(`[${requestId}] ⚠️ Message status is "${status}" - Message may be queued or processing`)
          console.log(`[${requestId}] ℹ️ This is normal for template messages. Check SendZen dashboard for delivery status.`)
        } else if (['sent', 'delivered', 'read'].includes(statusLower)) {
          console.log(`[${requestId}] ✅ Message status indicates success: ${status}`)
        } else if (['failed', 'rejected', 'error'].includes(statusLower)) {
          console.error(`[${requestId}] ❌ Message status indicates failure: ${status}`)
          return {
            success: false,
            error: `Message status: ${status}. Check SendZen dashboard for details.`,
          }
        }
      } else {
        console.warn(`[${requestId}] ⚠️ No status field found in response`)
      }

      // Check for account-level issues in response
      if (responseData.account_status || responseData.account_issues) {
        console.warn(`[${requestId}] ⚠️ Account status/issues detected:`, responseData.account_status || responseData.account_issues)
      }

      // Check for rate limiting or quota issues
      if (responseData.rate_limit || responseData.quota_exceeded) {
        console.error(`[${requestId}] ❌ Rate limit or quota issue:`, responseData.rate_limit || responseData.quota_exceeded)
        return {
          success: false,
          error: `Rate limit or quota exceeded. Check SendZen dashboard.`,
        }
      }

      // Log full response for debugging
      console.log(`[${requestId}] 📋 Full SendZen response structure:`)
      console.log(`[${requestId}] ${JSON.stringify(responseData, null, 2)}`)
    } else if (response.ok && !responseData) {
      console.warn(`[${requestId}] ⚠️ Response OK but no response data received`)
      console.warn(`[${requestId}] This might indicate an empty response or parsing issue`)
    }

    // Final validation - if we have a message ID or status, consider it successful
    const hasMessageId = responseData?.message_id || 
                        responseData?.id || 
                        responseData?.messages?.[0]?.id ||
                        responseData?.data?.message_id ||
                        responseData?.wamid
    
    if (!hasMessageId && response.ok) {
      console.warn(`[${requestId}] ⚠️ WARNING: Response OK but no message ID found`)
      console.warn(`[${requestId}] ⚠️ This might indicate the message was not actually sent`)
      console.warn(`[${requestId}] ⚠️ Check SendZen dashboard for account issues (payment, verification)`)
      console.warn(`[${requestId}] ⚠️ Response data:`, JSON.stringify(responseData, null, 2))
      
      // Still return success but with a warning
      // The message might be queued or there might be account issues
      console.log(`[${requestId}] ⚠️ Returning success but recommend checking SendZen dashboard`)
    }

    console.log(`[${requestId}] ✅ WhatsApp message API call completed`)
    console.log(`[${requestId}] 📊 Summary:`)
    console.log(`[${requestId}]   - HTTP Status: ${response.status}`)
    console.log(`[${requestId}]   - Response OK: ${response.ok}`)
    console.log(`[${requestId}]   - Has Message ID: ${hasMessageId ? 'Yes' : 'No'}`)
    console.log(`[${requestId}]   - Message Status: ${responseData?.status || responseData?.messages?.[0]?.status || 'Not provided'}`)
    console.log(`[${requestId}]   - Response Data:`, JSON.stringify(responseData, null, 2))

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

