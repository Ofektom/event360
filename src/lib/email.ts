/**
 * Email Service Configuration
 * 
 * Uses Resend for email delivery
 * Free tier: 3,000 emails/month, 100 emails/day
 */

import { Resend } from 'resend'

// Initialize Resend client
let resend: Resend | null = null

export function getEmailClient(): Resend | null {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY not configured. Email service will not work.')
      return null
    }
    
    resend = new Resend(apiKey)
  }
  
  return resend
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

export const FROM_EMAIL = process.env.FROM_EMAIL || 'Gbedoo <onboarding@resend.dev>'
export const FROM_NAME = process.env.FROM_NAME || 'Gbedoo'

