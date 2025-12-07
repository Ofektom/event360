'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { AddVendorModal } from './AddVendorModal'
import Image from 'next/image'

interface EventVendor {
  id: string
  role?: string | null
  notes?: string | null
  status: string
  vendor: {
    id: string
    businessName: string
    ownerName?: string | null
    category: string
    email: string
    phone: string
    whatsapp?: string | null
    website?: string | null
    city?: string | null
    state?: string | null
    logo?: string | null
    isVerified: boolean
    averageRating: number
    totalRatings: number
  }
}

interface EventVendorsListProps {
  eventId: string
  isOwner?: boolean
}

export function EventVendorsList({ eventId, isOwner = false }: EventVendorsListProps) {
  const [vendors, setVendors] = useState<EventVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchVendors()
  }, [eventId])

  const fetchVendors = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/vendors`)
      if (response.ok) {
        const data = await response.json()
        setVendors(data)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to remove this vendor from the event?')) {
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}/vendors/${vendorId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchVendors()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to remove vendor')
      }
    } catch (error) {
      console.error('Error removing vendor:', error)
      alert('Failed to remove vendor')
    }
  }

  if (loading) {
    return (
      <Card variant="elevated" padding="md">
        <div className="text-center py-8 text-gray-500">Loading vendors...</div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Vendors</h2>
        {isOwner && (
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
          >
            + Add Vendor
          </Button>
        )}
      </div>

      {vendors.length === 0 ? (
        <Card variant="elevated" padding="md">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No vendors added yet</p>
            {isOwner && (
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
              >
                Add Your First Vendor
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((eventVendor) => (
            <Card key={eventVendor.id} variant="elevated" padding="md">
              <div className="flex items-start gap-3 mb-3">
                {eventVendor.vendor.logo ? (
                  <Image
                    src={eventVendor.vendor.logo}
                    alt={eventVendor.vendor.businessName}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">
                      {eventVendor.vendor.businessName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {eventVendor.vendor.businessName}
                    </h3>
                    {eventVendor.vendor.isVerified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex-shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                  {eventVendor.vendor.ownerName && (
                    <p className="text-sm text-gray-600">{eventVendor.vendor.ownerName}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {eventVendor.vendor.category.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              {eventVendor.vendor.averageRating > 0 && (
                <div className="flex items-center gap-1 text-sm text-yellow-600 mb-2">
                  <span>⭐</span>
                  <span>{eventVendor.vendor.averageRating.toFixed(1)}</span>
                  <span className="text-gray-500">
                    ({eventVendor.vendor.totalRatings} reviews)
                  </span>
                </div>
              )}

              <div className="space-y-1 text-sm text-gray-600 mb-3">
                {eventVendor.vendor.email && (
                  <div>📧 {eventVendor.vendor.email}</div>
                )}
                {eventVendor.vendor.phone && (
                  <div>📞 {eventVendor.vendor.phone}</div>
                )}
                {eventVendor.vendor.city && eventVendor.vendor.state && (
                  <div>📍 {eventVendor.vendor.city}, {eventVendor.vendor.state}</div>
                )}
                {eventVendor.role && (
                  <div className="font-medium text-purple-600">Role: {eventVendor.role}</div>
                )}
              </div>

              {eventVendor.notes && (
                <div className="p-2 bg-gray-50 rounded text-sm text-gray-700 mb-3">
                  {eventVendor.notes}
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                {eventVendor.vendor.website && (
                  <a
                    href={eventVendor.vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:underline"
                  >
                    Website
                  </a>
                )}
                {eventVendor.vendor.whatsapp && (
                  <a
                    href={`https://wa.me/${eventVendor.vendor.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:underline"
                  >
                    WhatsApp
                  </a>
                )}
                {isOwner && (
                  <button
                    onClick={() => handleRemoveVendor(eventVendor.vendor.id)}
                    className="ml-auto text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddVendorModal
          eventId={eventId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchVendors()
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}

