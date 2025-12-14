/**
 * Simple Email Invitation Service using EmailJS
 * 
 * EmailJS provides free email sending without backend API keys
 * Documentation: https://www.emailjs.com/docs/
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
    const serviceId = process.env.EMAILJS_SERVICE_ID
    const templateId = process.env.EMAILJS_TEMPLATE_ID
    const publicKey = process.env.EMAILJS_PUBLIC_KEY

    if (!serviceId || !templateId || !publicKey) {
      console.warn('📧 EmailJS not configured. Missing environment variables.')
      return {
        success: false,
        error: 'Email service not configured. Please set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and EMAILJS_PUBLIC_KEY environment variables.',
      }
    }

    // Import EmailJS dynamically (it's a client-side library, but we can use it server-side with fetch)
    // For server-side, we'll use EmailJS REST API directly
    const emailData = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
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

