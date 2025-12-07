import { VendorDashboardLayout } from '@/components/templates/VendorDashboardLayout'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types/enums'
import { VendorReminderSettings } from '@/components/organisms/VendorReminderSettings'

export const dynamic = 'force-dynamic'

export default async function VendorSettingsPage() {
  try {
    const user = await requireAuth()
    
    // Redirect if not a vendor
    if (user.role !== UserRole.VENDOR) {
      redirect('/dashboard')
    }

    // Get vendor profile
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    })

    if (!vendor) {
      redirect('/vendor/dashboard')
    }

    return (
      <VendorDashboardLayout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
          <VendorReminderSettings vendor={vendor} />
        </div>
      </VendorDashboardLayout>
    )
  } catch (error) {
    redirect('/auth/signin')
  }
}

