import { getServerSession } from "next-auth/next"
import { authOptions } from "@/auth"

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)
    return session?.user || null
  } catch (error: any) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function requireAuth() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("Unauthorized")
    }
    return user
  } catch (error: any) {
    console.error('Error requiring auth:', error)
    throw error
  }
}
