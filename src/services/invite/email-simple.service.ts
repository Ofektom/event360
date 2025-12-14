/**
 * Simple Email Invitation Service using EmailJS
 * 
 * EmailJS provides free email sending without backend API keys
 * Documentation: https://www.emailjs.com/docs/
 * 
 * IMPORTANT: For server-side usage, you must enable "Allow EmailJS API for non-browser applications"
 * in your EmailJS account settings:
 * 1. Log in to https://www.emailjs.com/
 * 2. Go to Account > Security
 * 3. Enable "Allow EmailJS API for non-browser applications"
 * 
 * You can also use EMAILJS_PRIVATE_KEY (private API key) instead of EMAILJS_PUBLIC_KEY
 * for better security in server-side environments.
 */

interface SendEmailInviteParams {
  to: string
  inviteeName: string
  eventTitle: string
  invitationImageUrl?: string
  shareLink: string
  token: string
}

/**
 * Send email invitation using EmailJS
 */
export async function sendEmailInvite(
  params: SendEmailInviteParams
): Promise<{ success: boolean; error?: string }> {
  const { to, inviteeName, eventTitle, shareLink, invitationImageUrl } = params

  try {
    // Check if EmailJS is configured
    const serviceId = process.env.EMAILJS_SERVICE_ID?.trim()
    const templateId = process.env.EMAILJS_TEMPLATE_ID?.trim()
    const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim()
    const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim()
    
    // Use private key if available (for server-side), otherwise use public key
    // When using private key, we still need public key as user_id
    const apiKey = privateKey || publicKey
    const userId = publicKey // Always use public key as user_id

    if (!serviceId || !templateId || !userId) {
      console.warn('📧 EmailJS not configured. Missing environment variables.')
      const missing = []
      if (!serviceId) missing.push('EMAILJS_SERVICE_ID')
      if (!templateId) missing.push('EMAILJS_TEMPLATE_ID')
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

    // Determine which key to use as user_id
    // When "Use Private Key" is enabled in EmailJS, use private key as user_id
    // Otherwise, use public key
    const user_id = privateKey || publicKey

    // Log configuration (without exposing full key)
    console.log('📧 EmailJS Configuration:', {
      serviceId,
      templateId,
      hasPublicKey: !!publicKey,
      hasPrivateKey: !!privateKey,
      usingKeyType: privateKey ? 'PRIVATE_KEY' : 'PUBLIC_KEY',
      userIdLength: user_id.length,
      userIdPrefix: user_id.substring(0, 6) + '...',
      userIdSuffix: '...' + user_id.substring(user_id.length - 4),
      publicKeyPrefix: publicKey ? publicKey.substring(0, 6) + '...' : 'N/A',
      publicKeySuffix: publicKey ? '...' + publicKey.substring(publicKey.length - 4) : 'N/A',
    })

    // For server-side, we'll use EmailJS REST API directly
    // When "Use Private Key" is enabled in EmailJS settings, use private key as user_id
    const emailData = {
      service_id: serviceId,
      template_id: templateId,
      user_id: user_id, // Use private key if available, otherwise public key
      template_params: {
        to_email: to,
        to_name: inviteeName,
        event_title: eventTitle,
        invitation_link: shareLink,
        invitation_image_url: invitationImageUrl || '',
        from_name: 'gbedoo',
      },
    }

    // Log the request data (without exposing full keys)
    console.log('📧 EmailJS Request Data:', {
      service_id: serviceId,
      template_id: templateId,
      user_id: user_id.substring(0, 6) + '...' + user_id.substring(user_id.length - 4),
      template_params: emailData.template_params,
    })

    // Send email via EmailJS REST API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(emailData),
    })

    // Log response details
    console.log('📧 EmailJS API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ EmailJS API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        requestData: {
          service_id: serviceId,
          template_id: templateId,
          user_id: user_id.substring(0, 6) + '...' + user_id.substring(user_id.length - 4),
        },
      })
      
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

    console.log(`✅ Email invitation sent successfully to ${to}`)
    return {
      success: true,
    }
  } catch (error: any) {
    console.error('❌ Error sending email invitation:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email invitation',
    }
  }
}

