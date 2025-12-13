/**
 * Email Verification Service
 * 
 * Handles sending verification emails and verifying email addresses
 */

import { getEmailClient, isEmailConfigured, FROM_EMAIL } from '@/lib/email'
import { getUserVerificationTemplate } from '@/lib/email-templates'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(
  userId: string,
  email: string,
  name?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn('📧 Email service not configured. RESEND_API_KEY is missing.')
      return {
        success: false,
        error: 'Email service not configured.',
      }
    }

    // Generate verification token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

    // Store verification token in database
    // First, delete any existing tokens for this identifier
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
      },
    })

    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: expiresAt,
      },
    })

    // Generate verification link
    const { getBaseUrl } = await import('@/lib/utils')
    const baseUrl = getBaseUrl()
    const verificationLink = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

    // Generate email HTML
    const html = getUserVerificationTemplate({
      recipientName: name,
      verificationLink,
    })

    // Send email
    const resend = getEmailClient()
    if (!resend) {
      return {
        success: false,
        error: 'Failed to initialize email client.',
      }
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Verify your gbadoo email address',
      html,
    })

    if (result.error) {
      console.error('📧 Email verification send error:', result.error)
      return {
        success: false,
        error: result.error.message || 'Failed to send verification email',
      }
    }

    console.log('📧 Verification email sent:', {
      email,
      emailId: result.data?.id,
    })

    return { success: true }
  } catch (error: any) {
    console.error('📧 Error sending verification email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send verification email',
    }
  }
}

/**
 * Verify email address using token
 */
export async function verifyEmail(
  token: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find verification token using the compound unique constraint
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
    })

    if (!verificationToken) {
      return {
        success: false,
        error: 'Verification token not found.',
      }
    }

    // Check if token matches
    if (verificationToken.token !== token) {
      return {
        success: false,
        error: 'Invalid verification token.',
      }
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      return {
        success: false,
        error: 'Verification token has expired. Please request a new one.',
      }
    }

    // Update user's email verification status
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    })

    // Delete verification token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
    })

    console.log('✅ Email verified:', email)

    return { success: true }
  } catch (error: any) {
    console.error('❌ Error verifying email:', error)
    return {
      success: false,
      error: error.message || 'Failed to verify email',
    }
  }
}

