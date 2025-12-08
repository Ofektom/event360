import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the base URL for the application
 * Priority: NEXT_PUBLIC_APP_URL > NEXTAUTH_URL > fallback
 * Removes trailing slashes for consistency
 */
export function getBaseUrl(): string {
  const baseUrl = 
    process.env.NEXT_PUBLIC_APP_URL || 
    process.env.NEXTAUTH_URL || 
    'https://event360-three.vercel.app'
  
  // Remove trailing slash for consistency
  return baseUrl.replace(/\/$/, '')
}

