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
  refreshTrigger?: number // Add refresh trigger to force re-fetch
}

export function OrderOfEventsList({
  ceremonyId,
  ceremonyName,
  isOwner = false,
  onEdit,
  onCreateNew,
  refreshTrigger,
}: OrderOfEventsListProps) {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
  }, [ceremonyId, refreshTrigger])

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
  // Note: We don't pass location or type since these are ceremony-level details
  const programmeItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description || undefined,
    startTime: new Date(item.startTime),
    endTime: item.endTime ? new Date(item.endTime) : undefined,
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
        {isOwner && (
          <Button 
            variant="primary" 
            onClick={onCreateNew || (() => {})} 
            className="w-full sm:w-auto"
            disabled={!onCreateNew}
          >
            + Add Item
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📋</div>
          <p>No items in the order of events yet.</p>
          {isOwner && (
            <>
              <p className="text-sm mt-2 mb-4">
                Add items like opening prayer, processional, vows, etc.
              </p>
              <Button 
                variant="primary" 
                onClick={onCreateNew || (() => {})}
                disabled={!onCreateNew}
              >
                Add Your First Item
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[var(--theme-primary)] opacity-20"></div>

            <div className="space-y-8">
              {items.map((item, index) => (
                <div key={item.id} className="relative flex gap-6">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-[var(--theme-primary)] flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <Card variant="elevated" padding="md" className="relative group">
                      {/* Edit/Delete buttons - always visible for owners */}
                      {isOwner && (
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                          {onEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit(item.id)
                              }}
                              className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors shadow-md"
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
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 transition-colors shadow-md"
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
                      )}

                      <div className={isOwner ? "pr-20" : ""}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {item.title}
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-[var(--theme-primary)]">
                              {new Date(item.startTime).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </p>
                            {item.endTime && (
                              <p className="text-xs text-gray-500">
                                - {new Date(item.endTime).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-gray-600 mb-3">{item.description}</p>
                        )}
                        {item.notes && (
                          <div className="text-sm text-gray-500 italic">📝 {item.notes}</div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

