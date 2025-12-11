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
  itemId?: string // If provided, we're editing; otherwise, creating
  onClose: () => void
  onSuccess: () => void
}

export function ScheduleItemModal({
  ceremonyId,
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

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  // If editing, fetch the item data
  useEffect(() => {
    if (itemId) {
      fetchItem()
    }
  }, [itemId, ceremonyId])

  const fetchItem = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ceremonies/${ceremonyId}/schedule/${itemId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch schedule item')
      }
      const item: ScheduleItem = await response.json()
      
      // Format dates for input fields (YYYY-MM-DDTHH:mm)
      const startTime = new Date(item.startTime)
      const endTime = item.endTime ? new Date(item.endTime) : null
      
      setFormData({
        title: item.title || '',
        description: item.description || '',
        startTime: startTime.toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
        endTime: endTime ? endTime.toISOString().slice(0, 16) : '',
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
      if (!formData.title || !formData.startTime) {
        setError('Title and start time are required')
        setIsSubmitting(false)
        return
      }

      const payload: any = {
        title: formData.title,
        description: formData.description || null,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        notes: formData.notes || null,
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

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

