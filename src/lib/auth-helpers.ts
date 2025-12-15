import { getCurrentUser } from './auth'

/**
 * Require authentication - throws an error if user is not authenticated
 * Use this in API routes to ensure the user is logged in
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    const error = new Error('Unauthorized')
    ;(error as any).statusCode = 401
    throw error
  }
  
  return user
}

