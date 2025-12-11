/**
 * Vendor Invitation Email Service
 * 
 * Handles sending vendor invitation emails
 */

import { getEmailClient, isEmailConfigured, FROM_EMAIL } from '@/lib/email'
import { getVendorInvitationTemplate } from '@/lib/email-templates'

interface SendVendorInvitationEmailParams {
  to: string
  vendorName: string
  eventTitle: string
  eventOrganizerName?: string
  shareLink: string
  token?: string
}

export async function sendVendorInvitationEmail(
  params: SendVendorInvitationEmailParams
): Promise<{ success: boolean; error?: string }> {
  const { to, vendorName, eventTitle, eventOrganizerName, shareLink } = params

  try {
    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn('📧 Email service not configured. RESEND_API_KEY is missing.')
      return {
        success: false,
        error: 'Email service not configured. Please set RESEND_API_KEY environment variable.',
      }
    }

    const resend = getEmailClient()
    if (!resend) {
      return {
        success: false,
        error: 'Failed to initialize email client.',
      }
    }

    // Generate email HTML using template
    const html = getVendorInvitationTemplate({
      recipientName: vendorName,
      eventTitle,
      vendorName,
      shareLink,
    })

    // Send email via Resend
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Vendor Invitation: ${eventTitle}`,
      html,
    })

    if (result.error) {
      console.error('📧 Vendor invitation email send error:', result.error)
      return {
        success: false,
        error: result.error.message || 'Failed to send vendor invitation email',
      }
    }

    console.log('📧 Vendor invitation email sent successfully:', {
      to,
      vendorName,
      eventTitle,
      emailId: result.data?.id,
    })

    return { success: true }
  } catch (error: any) {
    console.error('📧 Error sending vendor invitation email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send vendor invitation email',
    }
  }
}

