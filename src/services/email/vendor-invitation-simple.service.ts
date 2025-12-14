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
    const serviceId = process.env.EMAILJS_SERVICE_ID
    const templateId = process.env.EMAILJS_VENDOR_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID
    // Use private key if available (for server-side), otherwise use public key
    const apiKey = process.env.EMAILJS_PRIVATE_KEY || process.env.EMAILJS_PUBLIC_KEY

    if (!serviceId || !templateId || !apiKey) {
      console.warn('📧 EmailJS not configured for vendor invitations.')
      return {
        success: false,
        error: 'Email service not configured. Please set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and EMAILJS_PUBLIC_KEY (or EMAILJS_PRIVATE_KEY) environment variables.',
      }
    }

    const emailData = {
      service_id: serviceId,
      template_id: templateId,
      user_id: apiKey, // Can be public or private key
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
      
      // Provide helpful error message if non-browser API is disabled
      if (errorText.includes('non-browser') || errorText.includes('disabled')) {
        return {
          success: false,
          error: 'EmailJS API calls are disabled for non-browser applications. Please enable "Allow EmailJS API for non-browser applications" in your EmailJS account settings (Account > Security).',
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

