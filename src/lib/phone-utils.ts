/**
 * Phone number normalization and validation utilities
 */

/**
 * Normalize phone number by removing common formatting characters
 * @param phone - Phone number string
 * @returns Normalized phone number or null
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  // Remove spaces, dashes, parentheses, but keep plus sign for international format
  return phone.replace(/\s|-|\(|\)/g, '').trim()
}

/**
 * Validate phone number format (basic validation)
 * @param phone - Phone number string
 * @returns true if valid format
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false
  // Basic validation: 10-15 digits (allowing international format)
  const digitsOnly = phone.replace(/\D/g, '')
  return digitsOnly.length >= 10 && digitsOnly.length <= 15
}

/**
 * Check if identifier is email or phone
 * @param identifier - Email or phone string
 * @returns 'email' | 'phone' | null
 */
export function identifyType(identifier: string): 'email' | 'phone' | null {
  if (!identifier) return null
  const trimmed = identifier.trim()
  if (trimmed.includes('@')) return 'email'
  // Check if it looks like a phone number (has digits and is 10+ chars)
  if (/^\+?[\d\s\-\(\)]{10,}$/.test(trimmed)) return 'phone'
  return null
}

