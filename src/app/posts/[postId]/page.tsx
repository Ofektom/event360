import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PostDetail } from '@/components/organisms/PostDetail'
import { BackButton } from '@/components/shared/BackButton'

// This page uses getCurrentUser() which accesses headers, so it must be dynamic
export const dynamic = 'force-dynamic'

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const user = await getCurrentUser()
  const { postId } = await params

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <BackButton href="/timeline" label="Back to Timeline" />
        </div>
        <PostDetail postId={postId} />
      </div>
    </DashboardLayout>
  )
}

