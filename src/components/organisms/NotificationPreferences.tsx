'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { NotificationChannel } from '@/types/enums'

interface NotificationPreferencesProps {
  userId: string
}

interface NotificationPreferencesData {
  notificationChannels: NotificationChannel[]
  whatsappChargesAccepted: boolean
}

const channelLabels: Record<NotificationChannel, { label: string; description: string; free: boolean }> = {
  [NotificationChannel.EMAIL]: {
    label: 'Email',
    description: 'Receive notifications via email',
    free: true,
  },
  [NotificationChannel.WHATSAPP]: {
    label: 'WhatsApp',
    description: 'Receive notifications via WhatsApp (paid service)',
    free: false,
  },
  [NotificationChannel.FACEBOOK_MESSENGER]: {
    label: 'Facebook Messenger',
    description: 'Receive notifications via Facebook Messenger',
    free: true,
  },
  [NotificationChannel.INSTAGRAM_DM]: {
    label: 'Instagram DM',
    description: 'Receive notifications via Instagram Direct Messages',
    free: true,
  },
  [NotificationChannel.SMS]: {
    label: 'SMS',
    description: 'Receive notifications via text message',
    free: false,
  },
  [NotificationChannel.IN_APP]: {
    label: 'In-App',
    description: 'Receive notifications within the app',
    free: true,
  },
}

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferencesData>({
    notificationChannels: [NotificationChannel.EMAIL],
    whatsappChargesAccepted: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [userId])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/user/notification-preferences')
      const data = await response.json()
      
      if (!response.ok) {
        // If it's a migration error, show a helpful message
        if (data.error?.includes('migration')) {
          setError('Database migration required. Please contact support or run: npx prisma migrate deploy')
        } else {
          setError(data.error || 'Failed to fetch notification preferences')
        }
        // Still set default preferences so UI can render
        setPreferences({
          notificationChannels: [NotificationChannel.EMAIL],
          whatsappChargesAccepted: false,
        })
        return
      }
      
      setPreferences({
        notificationChannels: data.notificationChannels || [NotificationChannel.EMAIL],
        whatsappChargesAccepted: data.whatsappChargesAccepted || false,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load notification preferences')
      // Set default preferences so UI can still render
      setPreferences({
        notificationChannels: [NotificationChannel.EMAIL],
        whatsappChargesAccepted: false,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChannelToggle = (channel: NotificationChannel) => {
    setPreferences((prev) => {
      const isSelected = prev.notificationChannels.includes(channel)
      let newChannels: NotificationChannel[]

      if (isSelected) {
        // Remove channel
        newChannels = prev.notificationChannels.filter((c) => c !== channel)
        // Ensure at least one channel is selected
        if (newChannels.length === 0) {
          newChannels = [NotificationChannel.EMAIL]
        }
      } else {
        // Add channel
        newChannels = [...prev.notificationChannels, channel]
      }

      // If WhatsApp is selected, show charge acceptance prompt
      if (!isSelected && channel === NotificationChannel.WHATSAPP) {
        const acceptCharges = window.confirm(
          'WhatsApp notifications are a paid service. You will be charged for each WhatsApp message sent. Do you want to continue?'
        )
        if (!acceptCharges) {
          return prev // Don't add WhatsApp if user declines
        }
      }

      return {
        ...prev,
        notificationChannels: newChannels,
        // Auto-accept charges if WhatsApp is selected
        whatsappChargesAccepted:
          newChannels.includes(NotificationChannel.WHATSAPP) || prev.whatsappChargesAccepted,
      }
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const response = await fetch('/api/user/notification-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save notification preferences')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save notification preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Notification Preferences</h2>
          <p className="text-sm text-gray-600">
            Choose how you want to receive notifications and invitations. You can select multiple
            channels.
          </p>
        </div>

        {error && <ErrorMessage message={error} />}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            Notification preferences saved successfully!
          </div>
        )}

        <div className="space-y-4">
          {Object.values(NotificationChannel).map((channel) => {
            const isSelected = preferences.notificationChannels.includes(channel)
            const channelInfo = channelLabels[channel]

            return (
              <div
                key={channel}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  id={`channel-${channel}`}
                  checked={isSelected}
                  onChange={() => handleChannelToggle(channel)}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`channel-${channel}`}
                    className="block text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    {channelInfo.label}
                    {!channelInfo.free && (
                      <span className="ml-2 text-xs text-orange-600 font-semibold">(Paid)</span>
                    )}
                  </label>
                  <p className="text-sm text-gray-600 mt-1">{channelInfo.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {preferences.notificationChannels.includes(NotificationChannel.WHATSAPP) && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-orange-600 text-xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-orange-900 mb-1">
                  WhatsApp Charges Accepted
                </h3>
                <p className="text-sm text-orange-700">
                  You have accepted charges for WhatsApp notifications. You will be charged for each
                  WhatsApp message sent to you.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

