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
    
    // Determine which key to use as user_id
    // When "Use Private Key" is enabled in EmailJS Account > Security settings,
    // you MUST use the private key as user_id. The public key is still required
    // to be set and valid, but is not used as user_id in this case.
    // If private key is not set, use public key (standard mode)
    const usePrivateKey = !!privateKey
    const user_id = usePrivateKey ? privateKey : publicKey

    if (!serviceId || !templateId) {
      console.warn('📧 EmailJS not configured. Missing environment variables.')
      const missing = []
      if (!serviceId) missing.push('EMAILJS_SERVICE_ID')
      if (!templateId) missing.push('EMAILJS_TEMPLATE_ID')
      
      return {
        success: false,
        error: `Email service not configured. Missing: ${missing.join(', ')}. Please set these environment variables in your Vercel project settings.`,
      }
    }

    // Public key is always required (even when using private key mode)
    if (!publicKey) {
      return {
        success: false,
        error: 'EMAILJS_PUBLIC_KEY is required. Please set it in your Vercel environment variables. You can find your Public Key at https://dashboard.emailjs.com/admin/account under "API Keys".',
      }
    }

    // If private key is set, we assume "Use Private Key" is enabled in EmailJS
    // In this case, private key must be valid
    if (usePrivateKey && !privateKey) {
      return {
        success: false,
        error: 'EMAILJS_PRIVATE_KEY is set but empty. Please set a valid private key in Vercel, or remove EMAILJS_PRIVATE_KEY to use public key mode.',
      }
    }

    if (!user_id) {
      return {
        success: false,
        error: 'EmailJS API key not found. Please set either EMAILJS_PUBLIC_KEY (standard mode) or both EMAILJS_PUBLIC_KEY and EMAILJS_PRIVATE_KEY (private key mode) in your Vercel environment variables.',
      }
    }

    // Validate public key format (should be alphanumeric, typically 16-20 characters)
    // EmailJS public keys are usually alphanumeric strings
    if (publicKey.length < 10 || publicKey.length > 50) {
      console.error('❌ EmailJS Public Key has invalid length:', publicKey.length)
      return {
        success: false,
        error: `EmailJS Public Key appears to be invalid (length: ${publicKey.length}). Expected length: 10-50 characters. Please verify your EMAILJS_PUBLIC_KEY in Vercel environment variables. Check for extra spaces or incorrect copying.`,
      }
    }

    // Check for common issues: extra spaces, newlines, quotes
    if (publicKey !== publicKey.trim() || publicKey.includes('\n') || publicKey.includes('"') || publicKey.includes("'")) {
      console.error('❌ EmailJS Public Key contains invalid characters or whitespace')
      return {
        success: false,
        error: 'EmailJS Public Key contains invalid characters (spaces, newlines, or quotes). Please ensure the key is copied exactly from EmailJS dashboard without any extra characters. Remove any quotes if you added them in Vercel.',
      }
    }

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
      publicKeyLength: publicKey.length,
      publicKeyPrefix: publicKey ? publicKey.substring(0, 6) + '...' : 'N/A',
      publicKeySuffix: publicKey ? '...' + publicKey.substring(publicKey.length - 4) : 'N/A',
      publicKeyHasSpaces: publicKey.includes(' '),
      publicKeyHasNewlines: publicKey.includes('\n'),
      publicKeyStartsWithQuote: publicKey.startsWith('"') || publicKey.startsWith("'"),
      publicKeyEndsWithQuote: publicKey.endsWith('"') || publicKey.endsWith("'"),
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
      let errorJson: any = null
      try {
        errorJson = JSON.parse(errorText)
      } catch {
        // Not JSON, use text as is
      }
      
      console.error('❌ EmailJS API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500), // First 500 chars
        errorJson,
        requestData: {
          service_id: serviceId,
          template_id: templateId,
          usingPrivateKey: usePrivateKey,
          user_id_length: user_id.length,
          user_id_prefix: user_id.substring(0, 6) + '...',
          user_id_suffix: '...' + user_id.substring(user_id.length - 4),
          public_key_length: publicKey.length,
          public_key_prefix: publicKey.substring(0, 6) + '...',
          public_key_suffix: '...' + publicKey.substring(publicKey.length - 4),
        },
        fullErrorText: errorText, // Log full error for debugging
      })
      
      // Provide helpful error messages for common issues
      if (errorText.includes('non-browser') || errorText.includes('disabled')) {
        return {
          success: false,
          error: 'EmailJS API calls are disabled for non-browser applications. Please enable "Allow EmailJS API for non-browser applications" in your EmailJS account settings (Account > Security).',
        }
      }
      
      if (errorText.includes('Public Key is invalid') || errorText.includes('invalid') || errorText.includes('Invalid')) {
        // Try to parse JSON error for more details
        let detailedError = 'EmailJS Public Key is invalid.'
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.text || errorJson.message) {
            detailedError = errorJson.text || errorJson.message
          }
        } catch {
          // Not JSON, use the text as is
        }
        
        return {
          success: false,
          error: `${detailedError} 

Troubleshooting steps:
1. Check your configuration: Visit /api/debug/emailjs-config to see what keys are loaded
2. Verify the Public Key in EmailJS: Go to https://dashboard.emailjs.com/admin/account and copy your Public Key
3. Update Vercel environment variable:
   - Go to Vercel project Settings > Environment Variables
   - Find EMAILJS_PUBLIC_KEY
   - Update with the exact value (no quotes, no spaces, no newlines)
   - Make sure it matches exactly what's in EmailJS dashboard
4. Redeploy your application after updating the variable
5. If using private key: Ensure "Use Private Key" is enabled in EmailJS Account > Security settings, and set EMAILJS_PRIVATE_KEY in Vercel

Common issues:
- Key has extra spaces (check beginning/end)
- Key is wrapped in quotes (remove quotes in Vercel)
- Key was copied incorrectly (re-copy from EmailJS dashboard)
- Wrong key type (make sure it's the Public Key, not Private Key, unless using private key mode)`,
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

