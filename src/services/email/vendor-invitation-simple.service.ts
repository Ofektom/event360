/**
 * Simple Email Vendor Invitation Service using EmailJS
 * 
 * IMPORTANT: For server-side usage, you must enable "Allow EmailJS API for non-browser applications"
 * in your EmailJS account settings:
 * 1. Log in to https://www.emailjs.com/
 * 2. Go to Account > Security
 * 3. Enable "Allow EmailJS API for non-browser applications"
 */

interface SendVendorInvitationEmailParams {
  to: string
  vendorName: string
  businessName: string
  eventTitle: string
  eventOrganizerName: string
  shareLink: string
  eventLink?: string
}

/**
 * Send vendor invitation email using EmailJS
 */
export async function sendVendorInvitationEmail(
  params: SendVendorInvitationEmailParams
): Promise<{ success: boolean; error?: string }> {
  const { to, vendorName, businessName, eventTitle, eventOrganizerName, shareLink } = params

  try {
    const serviceId = process.env.EMAILJS_SERVICE_ID?.trim()
    const templateId = (process.env.EMAILJS_VENDOR_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID)?.trim()
    const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim()
    const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim()
    
    // Use private key if available (for server-side), otherwise use public key
    // When using private key, we still need public key as user_id
    const apiKey = privateKey || publicKey
    const userId = publicKey // Always use public key as user_id

    if (!serviceId || !templateId || !userId) {
      console.warn('📧 EmailJS not configured for vendor invitations.')
      const missing = []
      if (!serviceId) missing.push('EMAILJS_SERVICE_ID')
      if (!templateId) missing.push('EMAILJS_TEMPLATE_ID or EMAILJS_VENDOR_TEMPLATE_ID')
      if (!userId) missing.push('EMAILJS_PUBLIC_KEY')
      
      return {
        success: false,
        error: `Email service not configured. Missing: ${missing.join(', ')}. Please set these environment variables in your Vercel project settings.`,
      }
    }

    if (!apiKey) {
      return {
        success: false,
        error: 'EmailJS API key not found. Please set either EMAILJS_PUBLIC_KEY or EMAILJS_PRIVATE_KEY in your Vercel environment variables.',
      }
    }

    // Log configuration (without exposing full key)
    console.log('📧 EmailJS Vendor Configuration:', {
      serviceId,
      templateId,
      hasPublicKey: !!publicKey,
      hasPrivateKey: !!privateKey,
      apiKeyType: privateKey ? 'PRIVATE_KEY' : 'PUBLIC_KEY',
      userIdLength: userId.length,
      userIdPrefix: userId.substring(0, 4) + '...',
    })

    const emailData = {
      service_id: serviceId,
      template_id: templateId,
      user_id: privateKey || userId, // Use private key if available, otherwise public key
      template_params: {
        to_email: to,
        vendor_name: vendorName,
        business_name: businessName,
        event_title: eventTitle,
        event_organizer: eventOrganizerName,
        invitation_link: shareLink,
        from_name: 'gbedoo',
      },
    }

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ EmailJS API Error:', errorText)
      
      // Provide helpful error messages for common issues
      if (errorText.includes('non-browser') || errorText.includes('disabled')) {
        return {
          success: false,
          error: 'EmailJS API calls are disabled for non-browser applications. Please enable "Allow EmailJS API for non-browser applications" in your EmailJS account settings (Account > Security).',
        }
      }
      
      if (errorText.includes('Public Key is invalid') || errorText.includes('invalid')) {
        return {
          success: false,
          error: 'EmailJS Public Key is invalid. Please verify your EMAILJS_PUBLIC_KEY environment variable. You can find your Public Key at https://dashboard.emailjs.com/admin/account under "API Keys". Make sure to copy the entire key without any extra spaces.',
        }
      }
      
      if (errorText.includes('domain') || errorText.includes('Domain') || errorText.includes('origin')) {
        return {
          success: false,
          error: 'EmailJS domain restriction may be blocking requests. The domain restriction feature requires a paid plan. For server-side API calls with private key, domain restriction may not be strictly enforced. If this error persists, try: 1) Upgrade your EmailJS plan to set domain restrictions, or 2) Contact EmailJS support to verify if domain restriction is required for your use case.',
        }
      }
      
      return {
        success: false,
        error: `Failed to send email: ${errorText}`,
      }
    }

    console.log(`✅ Vendor invitation email sent successfully to ${to}`)
    return {
      success: true,
    }
  } catch (error: any) {
    console.error('❌ Error sending vendor invitation email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send vendor invitation email',
    }
  }
}

