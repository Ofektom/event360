'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ProgrammeList } from './ProgrammeList'

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

interface OrderOfEventsListProps {
  ceremonyId: string
  ceremonyName: string
  isOwner?: boolean
  onEdit?: (itemId: string) => void
  onCreateNew?: () => void
}

export function OrderOfEventsList({
  ceremonyId,
  ceremonyName,
  isOwner = false,
  onEdit,
  onCreateNew,
}: OrderOfEventsListProps) {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
  }, [ceremonyId])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ceremonies/${ceremonyId}/schedule`)
      if (!response.ok) {
        throw new Error('Failed to fetch schedule items')
      }
      const data = await response.json()
      // Sort by order
      const sorted = data.sort((a: ScheduleItem, b: ScheduleItem) => a.order - b.order)
      setItems(sorted)
    } catch (error) {
      console.error('Error fetching schedule items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this item from the order of events?')) {
      return
    }

    try {
      setDeletingId(itemId)
      const response = await fetch(`/api/ceremonies/${ceremonyId}/schedule/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      setItems(items.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  // Convert to ProgrammeList format
  const programmeItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description || undefined,
    startTime: new Date(item.startTime),
    endTime: item.endTime ? new Date(item.endTime) : undefined,
    location: item.location || undefined,
    order: item.order,
  }))

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Order of Events - {ceremonyName}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            The sequence of activities for this ceremony
          </p>
        </div>
        {isOwner && onCreateNew && (
          <Button variant="primary" onClick={onCreateNew} className="w-full sm:w-auto">
            + Add Item
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📋</div>
          <p>No items in the order of events yet.</p>
          {isOwner && onCreateNew && (
            <>
              <p className="text-sm mt-2 mb-4">
                Add items like opening prayer, processional, vows, etc.
              </p>
              <Button variant="primary" onClick={onCreateNew}>
                Add Your First Item
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <ProgrammeList items={programmeItems} variant="timeline" />
          
          {isOwner && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <Card
                    key={item.id}
                    className="p-4 hover:shadow-md transition-shadow relative group"
                  >
                    <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(item.id)
                          }}
                          className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
                          title="Edit item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        disabled={deletingId === item.id}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 transition-colors"
                        title="Delete item"
                      >
                        {deletingId === item.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="pr-12">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      )}
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>
                          🕐 {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {item.endTime && ` - ${new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                        {item.location && (
                          <div>📍 {item.location}</div>
                        )}
                        {item.type && (
                          <div className="text-purple-600">🏷️ {item.type}</div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

