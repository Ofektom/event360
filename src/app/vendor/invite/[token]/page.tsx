import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { VendorInviteAcceptance } from '@/components/organisms/VendorInviteAcceptance'

export const dynamic = 'force-dynamic'

interface VendorInvitePageProps {
  params: Promise<{ token: string }>
}

export default async function VendorInvitePage({ params }: VendorInvitePageProps) {
  const { token } = await params

  // Find vendor by invitation token
  const vendor = await prisma.vendor.findUnique({
    where: { invitationToken: token },
    include: {
      eventVendors: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              location: true,
            },
          },
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!vendor) {
    redirect('/auth/signup/vendor?error=invalid_token')
  }

  // If vendor already has an account, redirect to dashboard
  if (vendor.userId) {
    redirect('/vendor/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <VendorInviteAcceptance vendor={vendor} token={token} />
    </div>
  )
}

