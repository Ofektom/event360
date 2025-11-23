import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PostDetail } from '@/components/organisms/PostDetail'

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
          <Link href="/timeline">
            <Button variant="outline" size="sm">
              ← Back to Timeline
            </Button>
          </Link>
        </div>
        <PostDetail postId={postId} />
      </div>
    </DashboardLayout>
  )
}

