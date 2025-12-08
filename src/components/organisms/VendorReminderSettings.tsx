'use client'

import { useState } from 'react'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/atoms/Card'

interface VendorReminderSettingsProps {
  vendor: any
}

export function VendorReminderSettings({ vendor }: VendorReminderSettingsProps) {
  const reminderPrefs = (vendor.reminderPreferences as any) || {
    whatsapp: true,
    email: true,
    daysBefore: [7, 1],
  }

  const [preferences, setPreferences] = useState({
    whatsapp: reminderPrefs.whatsapp ?? true,
    email: reminderPrefs.email ?? true,
    daysBefore: reminderPrefs.daysBefore || [7, 1],
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = (key: 'whatsapp' | 'email') => {
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    })
    setError('')
    setSuccess('')
  }

  const handleDaysChange = (index: number, value: number) => {
    const newDays = [...preferences.daysBefore]
    newDays[index] = value
    setPreferences({
      ...preferences,
      daysBefore: newDays.sort((a, b) => b - a), // Sort descending
    })
    setError('')
    setSuccess('')
  }

  const handleAddDay = () => {
    if (preferences.daysBefore.length < 5) {
      setPreferences({
        ...preferences,
        daysBefore: [...preferences.daysBefore, 1].sort((a, b) => b - a),
      })
    }
  }

  const handleRemoveDay = (index: number) => {
    if (preferences.daysBefore.length > 1) {
      const newDays = preferences.daysBefore.filter((_: number, i: number) => i !== index)
      setPreferences({
        ...preferences,
        daysBefore: newDays,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/vendor/reminder-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update reminder preferences')
        return
      }

      setSuccess('Reminder preferences updated successfully!')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Reminder Preferences</h2>
          <p className="text-sm text-gray-600 mb-6">
            Choose how you want to receive reminders about upcoming events
          </p>

          {/* Notification Channels */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-900">WhatsApp</label>
                <p className="text-xs text-gray-500 mt-1">
                  Receive reminders via WhatsApp at {vendor.whatsapp || vendor.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('whatsapp')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.whatsapp ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.whatsapp ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-900">Email</label>
                <p className="text-xs text-gray-500 mt-1">
                  Receive reminders via email at {vendor.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('email')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.email ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Days Before */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Remind me before event (days)
            </label>
            <div className="space-y-2">
              {preferences.daysBefore.map((days: number, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={days}
                    onChange={(e) => handleDaysChange(index, parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">
                    {days === 1 ? 'day' : 'days'} before event
                  </span>
                  {preferences.daysBefore.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDay(index)}
                      className="ml-auto text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {preferences.daysBefore.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddDay}
                  className="text-sm text-purple-600 hover:underline"
                >
                  + Add another reminder
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isLoading}
        >
          Save Preferences
        </Button>
      </form>
    </Card>
  )
}

