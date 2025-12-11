/**
 * Email Templates
 * 
 * Reusable email templates for various notifications
 */

export interface EmailTemplateProps {
  recipientName?: string
  eventTitle?: string
  invitationImageUrl?: string
  shareLink?: string
  verificationLink?: string
  vendorName?: string
  eventDetails?: {
    date?: string
    location?: string
    time?: string
  }
}

/**
 * Base email template wrapper
 */
function getBaseTemplate(content: string, title?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Event360'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Event360</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} Event360. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                This email was sent by Event360. If you have any questions, please contact support.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Guest Invitation Email Template
 */
export function getGuestInvitationTemplate(props: EmailTemplateProps): string {
  const { recipientName = 'Guest', eventTitle = 'Event', invitationImageUrl, shareLink } = props
  
  const content = `
    <div style="text-align: center;">
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
        🎉 You're Invited!
      </h2>
      
      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        Hi ${recipientName},
      </p>
      
      <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        You're invited to <strong style="color: #9333ea;">${eventTitle}</strong>!
      </p>
      
      ${invitationImageUrl ? `
        <div style="margin: 30px 0; text-align: center;">
          <img 
            src="${invitationImageUrl}" 
            alt="Event Invitation" 
            style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
          />
        </div>
      ` : ''}
      
      <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; text-align: left;">
        <p style="margin: 0 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">
          What you can do:
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
          <li>View your invitation</li>
          <li>See event details and schedule</li>
          <li>RSVP to the event</li>
          <li>View and share event photos</li>
          <li>Stream the event live</li>
        </ul>
      </div>
      
      ${shareLink ? `
        <div style="margin: 30px 0; text-align: center;">
          <a 
            href="${shareLink}" 
            style="display: inline-block; background-color: #9333ea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(147, 51, 234, 0.3);"
          >
            View Event & Invitation
          </a>
        </div>
      ` : ''}
      
      <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        We're excited to have you join us for this special occasion!
      </p>
    </div>
  `
  
  return getBaseTemplate(content, `You're Invited to ${eventTitle}`)
}

/**
 * User Verification Email Template
 */
export function getUserVerificationTemplate(props: EmailTemplateProps): string {
  const { recipientName = 'User', verificationLink } = props
  
  const content = `
    <div style="text-align: center;">
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
        ✉️ Verify Your Email Address
      </h2>
      
      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        Hi ${recipientName},
      </p>
      
      <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        Thank you for signing up for Event360! Please verify your email address to complete your registration.
      </p>
      
      ${verificationLink ? `
        <div style="margin: 30px 0; text-align: center;">
          <a 
            href="${verificationLink}" 
            style="display: inline-block; background-color: #9333ea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(147, 51, 234, 0.3);"
          >
            Verify Email Address
          </a>
        </div>
      ` : ''}
      
      <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        If you didn't create an account with Event360, you can safely ignore this email.
      </p>
      
      <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
        This verification link will expire in 24 hours.
      </p>
    </div>
  `
  
  return getBaseTemplate(content, 'Verify Your Email Address')
}

/**
 * Vendor Invitation Email Template
 */
export function getVendorInvitationTemplate(props: EmailTemplateProps): string {
  const { recipientName = 'Vendor', eventTitle = 'Event', vendorName, shareLink } = props
  
  const content = `
    <div style="text-align: center;">
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
        🎯 Vendor Invitation
      </h2>
      
      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        Hi ${recipientName || vendorName},
      </p>
      
      <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        You've been invited to provide services for <strong style="color: #9333ea;">${eventTitle}</strong>!
      </p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; text-align: left;">
        <p style="margin: 0 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">
          Next Steps:
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
          <li>Accept the invitation to join the event</li>
          <li>View event details and requirements</li>
          <li>Coordinate with the event organizer</li>
          <li>Manage your vendor profile</li>
        </ul>
      </div>
      
      ${shareLink ? `
        <div style="margin: 30px 0; text-align: center;">
          <a 
            href="${shareLink}" 
            style="display: inline-block; background-color: #9333ea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(147, 51, 234, 0.3);"
          >
            Accept Invitation
          </a>
        </div>
      ` : ''}
      
      <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        We look forward to working with you!
      </p>
    </div>
  `
  
  return getBaseTemplate(content, `Vendor Invitation - ${eventTitle}`)
}

/**
 * Event Notification Email Template
 */
export function getEventNotificationTemplate(props: EmailTemplateProps): string {
  const { recipientName = 'Guest', eventTitle = 'Event', eventDetails, shareLink } = props
  
  const content = `
    <div style="text-align: center;">
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
        📅 Event Update
      </h2>
      
      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        Hi ${recipientName},
      </p>
      
      <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        There's an update for <strong style="color: #9333ea;">${eventTitle}</strong>:
      </p>
      
      ${eventDetails ? `
        <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; text-align: left;">
          ${eventDetails.date ? `
            <p style="margin: 0 0 10px 0; color: #111827; font-size: 15px;">
              <strong>Date:</strong> <span style="color: #374151;">${eventDetails.date}</span>
            </p>
          ` : ''}
          ${eventDetails.time ? `
            <p style="margin: 0 0 10px 0; color: #111827; font-size: 15px;">
              <strong>Time:</strong> <span style="color: #374151;">${eventDetails.time}</span>
            </p>
          ` : ''}
          ${eventDetails.location ? `
            <p style="margin: 0 0 0 0; color: #111827; font-size: 15px;">
              <strong>Location:</strong> <span style="color: #374151;">${eventDetails.location}</span>
            </p>
          ` : ''}
        </div>
      ` : ''}
      
      ${shareLink ? `
        <div style="margin: 30px 0; text-align: center;">
          <a 
            href="${shareLink}" 
            style="display: inline-block; background-color: #9333ea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(147, 51, 234, 0.3);"
          >
            View Event Details
          </a>
        </div>
      ` : ''}
    </div>
  `
  
  return getBaseTemplate(content, `Update: ${eventTitle}`)
}

