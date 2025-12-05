import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

// This page uses getCurrentUser() which accesses headers, so it must be dynamic
export const dynamic = 'force-dynamic'

// Redirect dashboard to timeline
export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Redirect to timeline
  redirect('/timeline')
}

