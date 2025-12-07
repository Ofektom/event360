import { VendorDashboardLayout } from '@/components/templates/VendorDashboardLayout'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types/enums'
import { VendorDashboardHome } from '@/components/organisms/VendorDashboardHome'

export const dynamic = 'force-dynamic'

export default async function VendorDashboardPage() {
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
                startDate: true,
                endDate: true,
                location: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        ratings: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
            event: {
              select: {
                title: true,
              },
            },
          },
        },
        _count: {
          select: {
            eventVendors: true,
            ratings: true,
          },
        },
      },
    })

    if (!vendor) {
      redirect('/vendor/profile')
    }

    // Calculate stats
    const upcomingEvents = vendor.eventVendors.filter(
      (ev) => ev.event.startDate && new Date(ev.event.startDate) > new Date()
    ).length

    const completedEvents = vendor.eventVendors.filter(
      (ev) => ev.event.status === 'COMPLETED'
    ).length

    return (
      <VendorDashboardLayout>
        <VendorDashboardHome
          vendor={vendor}
          stats={{
            totalEvents: vendor._count.eventVendors,
            upcomingEvents,
            completedEvents,
            averageRating: vendor.averageRating,
            totalRatings: vendor._count.ratings,
          }}
        />
      </VendorDashboardLayout>
    )
  } catch (error) {
    redirect('/auth/signin')
  }
}

