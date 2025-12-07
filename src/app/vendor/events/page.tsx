import { VendorDashboardLayout } from '@/components/templates/VendorDashboardLayout'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types/enums'
import { VendorEventList } from '@/components/organisms/VendorEventList'

export const dynamic = 'force-dynamic'

export default async function VendorEventsPage() {
  try {
    const user = await requireAuth()
    
    // Redirect if not a vendor
    if (user.role !== UserRole.VENDOR) {
      redirect('/dashboard')
    }

    // Get vendor profile
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
      include: {
        eventVendors: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                location: true,
                status: true,
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!vendor) {
      redirect('/vendor/dashboard')
    }

    return (
      <VendorDashboardLayout>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">My Events</h1>
          <VendorEventList events={vendor.eventVendors} />
        </div>
      </VendorDashboardLayout>
    )
  } catch (error) {
    redirect('/auth/signin')
  }
}

