import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

// Redirect dashboard to timeline
export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Redirect to timeline
  redirect('/timeline')
}

