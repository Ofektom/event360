import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NotificationPreferences } from '@/components/organisms/NotificationPreferences'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  try {
    const user = await requireAuth()

    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          {/* Notification Preferences */}
          <NotificationPreferences userId={user.id} />
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    redirect('/auth/signin')
  }
}

