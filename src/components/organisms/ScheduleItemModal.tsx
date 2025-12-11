'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card } from '@/components/atoms/Card'

interface ScheduleItem {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string | null
  order: number
  type: string | null
  location: string | null
  notes: string | null
}

interface ScheduleItemModalProps {
  ceremonyId: string
  ceremonyDate?: string // Ceremony date to combine with time
  itemId?: string // If provided, we're editing; otherwise, creating
  onClose: () => void
  onSuccess: () => void
}

export function ScheduleItemModal({
  ceremonyId,
  ceremonyDate,
  itemId,
  onClose,
  onSuccess,
}: ScheduleItemModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    notes: '',
    order: '',
  })

  const [hasTime, setHasTime] = useState(false) // Checkbox state - controls visibility of time fields
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchedCeremonyDate, setFetchedCeremonyDate] = useState<string | null>(null)

  // Fetch ceremony date and item data if editing
  useEffect(() => {
    fetchCeremonyDate()
    if (itemId) {
      fetchItem()
    }
  }, [itemId, ceremonyId])

  const fetchCeremonyDate = async () => {
    try {
      const response = await fetch(`/api/ceremonies/${ceremonyId}`)
      if (response.ok) {
        const ceremony = await response.json()
        if (ceremony.date) {
          setFetchedCeremonyDate(ceremony.date)
        }
      }
    } catch (err) {
      console.error('Error fetching ceremony date:', err)
    }
  }

  const fetchItem = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ceremonies/${ceremonyId}/schedule/${itemId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch schedule item')
      }
      const item: ScheduleItem = await response.json()
      
      // Extract time from datetime (HH:mm format)
      const startTime = item.startTime ? new Date(item.startTime) : null
      const endTime = item.endTime ? new Date(item.endTime) : null
      
      // Check if item has time
      const itemHasTime = !!startTime
      setHasTime(itemHasTime)
      
      setFormData({
        title: item.title || '',
        description: item.description || '',
        startTime: startTime ? `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}` : '',
        endTime: endTime ? `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}` : '',
        notes: item.notes || '',
        order: item.order.toString(),
      })
    } catch (err: any) {
      console.error('Error fetching schedule item:', err)
      setError(err.message || 'Failed to load schedule item')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (!formData.title) {
        setError('Title is required')
        setIsSubmitting(false)
        return
      }

      // If hasTime is checked, validate that startTime is provided
      if (hasTime && !formData.startTime) {
        setError('Start time is required when time is enabled')
        setIsSubmitting(false)
        return
      }

      // Build payload
      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        notes: formData.notes || undefined,
      }

      // Only include times if hasTime is checked and times are provided
      // Use prop ceremonyDate first, then fetched date, then current date as fallback
      const dateToUse = ceremonyDate || fetchedCeremonyDate
      if (hasTime && formData.startTime && dateToUse) {
        // Combine ceremony date with time (HH:mm format)
        const [hours, minutes] = formData.startTime.split(':')
        const startDateTime = new Date(dateToUse)
        startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
        payload.startTime = startDateTime.toISOString()

        if (formData.endTime) {
          const [endHours, endMinutes] = formData.endTime.split(':')
          const endDateTime = new Date(dateToUse)
          endDateTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10), 0, 0)
          payload.endTime = endDateTime.toISOString()
        }
      } else if (hasTime && formData.startTime) {
        // Fallback: if no ceremony date, use current date
        const [hours, minutes] = formData.startTime.split(':')
        const startDateTime = new Date()
        startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
        payload.startTime = startDateTime.toISOString()

        if (formData.endTime) {
          const [endHours, endMinutes] = formData.endTime.split(':')
          const endDateTime = new Date()
          endDateTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10), 0, 0)
          payload.endTime = endDateTime.toISOString()
        }
      }

      // Only include order if provided (for new items, it will be auto-assigned)
      if (formData.order) {
        payload.order = parseInt(formData.order, 10)
      }

      const url = itemId
        ? `/api/ceremonies/${ceremonyId}/schedule/${itemId}`
        : `/api/ceremonies/${ceremonyId}/schedule`
      
      const method = itemId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save schedule item')
        return
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error saving schedule item:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-2xl w-full p-6">
          <div className="text-center py-8">Loading...</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {itemId ? 'Edit Schedule Item' : 'Add Schedule Item'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Opening Prayer, Processional, Vows"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of this item"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Checkbox to toggle time fields */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasTime"
                checked={hasTime}
                onChange={(e) => {
                  setHasTime(e.target.checked)
                  if (!e.target.checked) {
                    // Clear time fields when unchecked
                    setFormData({ ...formData, startTime: '', endTime: '' })
                  }
                }}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="hasTime" className="ml-2 block text-sm font-medium text-gray-700">
                Add time for this item
              </label>
            </div>

            {/* Time fields - only shown when checkbox is checked */}
            {hasTime && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required={hasTime}
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            {!itemId && (
              <div>
                <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
                  Order (optional)
                </label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  placeholder="Leave empty to add at the end"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If not specified, the item will be added at the end of the list
                </p>
              </div>
            )}

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or instructions"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : itemId ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

