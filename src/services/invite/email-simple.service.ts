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
    // Use private key if available (for server-side), otherwise use public key
    const apiKey = (process.env.EMAILJS_PRIVATE_KEY || process.env.EMAILJS_PUBLIC_KEY)?.trim()

    if (!serviceId || !templateId || !apiKey) {
      console.warn('📧 EmailJS not configured. Missing environment variables.')
      const missing = []
      if (!serviceId) missing.push('EMAILJS_SERVICE_ID')
      if (!templateId) missing.push('EMAILJS_TEMPLATE_ID')
      if (!apiKey) missing.push('EMAILJS_PUBLIC_KEY or EMAILJS_PRIVATE_KEY')
      
      return {
        success: false,
        error: `Email service not configured. Missing: ${missing.join(', ')}. Please set these environment variables in your Vercel project settings.`,
      }
    }

    // Log configuration (without exposing full key)
    console.log('📧 EmailJS Configuration:', {
      serviceId,
      templateId,
      apiKeyType: process.env.EMAILJS_PRIVATE_KEY ? 'PRIVATE_KEY' : 'PUBLIC_KEY',
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 4) + '...',
    })

    // For server-side, we'll use EmailJS REST API directly
    const emailData = {
      service_id: serviceId,
      template_id: templateId,
      user_id: apiKey, // Can be public or private key
      template_params: {
        to_email: to,
        to_name: inviteeName,
        event_title: eventTitle,
        invitation_link: shareLink,
        invitation_image_url: invitationImageUrl || '',
        from_name: 'gbedoo',
      },
    }

    // Send email via EmailJS REST API
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

