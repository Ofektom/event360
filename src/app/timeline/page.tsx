import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TimelineFeed } from '@/components/organisms/TimelineFeed'

// This page uses getCurrentUser() which accesses headers, so it must be dynamic
export const dynamic = 'force-dynamic'

export default async function TimelinePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardLayout>
      <div className="w-full">
        {/* Timeline Feed - No heading, just continuous cards like Facebook */}
        <TimelineFeed />
      </div>
    </DashboardLayout>
  )
}

