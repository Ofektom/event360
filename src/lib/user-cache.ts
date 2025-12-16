/**
 * User Profile Cache Utility
 * Caches user profile data in localStorage for faster loading on returning visits
 */

const CACHE_KEY = 'gbedoo_user_profile'
const CACHE_EXPIRY_KEY = 'gbedoo_user_profile_expiry'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

interface CachedUserProfile {
  id: string
  name: string | null
  email: string | null
  image: string | null
  phone: string | null
  role: string
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
  cachedAt: number // timestamp
}

/**
 * Save user profile data to cache
 */
export function cacheUserProfile(profile: Partial<CachedUserProfile>): void {
  if (typeof window === 'undefined') return

  try {
    const cachedData: CachedUserProfile = {
      ...profile,
      cachedAt: Date.now(),
    } as CachedUserProfile

    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData))
    localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION))
  } catch (error) {
    console.error('Error caching user profile:', error)
  }
}

/**
 * Get cached user profile data
 */
export function getCachedUserProfile(): CachedUserProfile | null {
  if (typeof window === 'undefined') return null

  try {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY)
    if (!expiry) return null

    const expiryTime = parseInt(expiry, 10)
    if (Date.now() > expiryTime) {
      // Cache expired, clear it
      clearUserProfileCache()
      return null
    }

    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    return JSON.parse(cached) as CachedUserProfile
  } catch (error) {
    console.error('Error reading cached user profile:', error)
    return null
  }
}

/**
 * Clear cached user profile data
 */
export function clearUserProfileCache(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_EXPIRY_KEY)
  } catch (error) {
    console.error('Error clearing user profile cache:', error)
  }
}

/**
 * Check if cache is valid
 */
export function isCacheValid(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY)
    if (!expiry) return false

    const expiryTime = parseInt(expiry, 10)
    return Date.now() < expiryTime
  } catch (error) {
    return false
  }
}

/**
 * Update specific fields in cached profile
 */
export function updateCachedUserProfile(updates: Partial<CachedUserProfile>): void {
  if (typeof window === 'undefined') return

  const cached = getCachedUserProfile()
  if (!cached) return

  const updated = {
    ...cached,
    ...updates,
    cachedAt: Date.now(),
  }

  cacheUserProfile(updated)
}

