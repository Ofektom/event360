'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card } from '@/components/atoms/Card'

const VENDOR_CATEGORIES = [
  { value: 'MAKEUP_ARTIST', label: 'Make-up Artist' },
  { value: 'RENTALS', label: 'Rentals' },
  { value: 'BRIDALS', label: 'Bridals' },
  { value: 'FASHION_DESIGNER', label: 'Fashion Designer' },
  { value: 'HAIR_STYLIST', label: 'Hair Stylist' },
  { value: 'BARBER', label: 'Barber' },
  { value: 'COOK', label: 'Cook' },
  { value: 'DECORATOR', label: 'Decorator' },
  { value: 'CAKE_PASTRY_MAKER', label: 'Cake/Pastry Maker' },
  { value: 'BAND', label: 'Band' },
  { value: 'GROOMING_ARTIST', label: 'Grooming Artist' },
  { value: 'MC_COMPERE', label: 'MC (Compere)' },
  { value: 'PHOTOGRAPHER', label: 'Photographer' },
  { value: 'VIDEOGRAPHER', label: 'Videographer' },
  { value: 'DJ', label: 'DJ' },
  { value: 'CATERER', label: 'Caterer' },
  { value: 'FLORIST', label: 'Florist' },
]

interface Vendor {
  id: string
  businessName: string
  ownerName?: string
  category: string
  email: string
  phone: string
  city?: string
  state?: string
  isVerified: boolean
  averageRating: number
  totalRatings: number
}

interface AddVendorModalProps {
  eventId: string
  onClose: () => void
  onSuccess: () => void
}

export function AddVendorModal({ eventId, onClose, onSuccess }: AddVendorModalProps) {
  const [mode, setMode] = useState<'search' | 'new'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Vendor[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  
  const [formData, setFormData] = useState({
    ownerName: '',
    businessName: '',
    category: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    description: '',
    website: '',
    role: '',
    notes: '',
  })
  
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Search vendors
  useEffect(() => {
    if (mode === 'search' && searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchVendors()
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, mode])

  const searchVendors = async () => {
    setIsSearching(true)
    try {
      const response = await fetch(`/api/vendors?search=${encodeURIComponent(searchQuery)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (err) {
      console.error('Error searching vendors:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setFormData({
      ...formData,
      businessName: vendor.businessName,
      email: vendor.email,
      phone: vendor.phone,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const payload: any = {
        role: formData.role || null,
        notes: formData.notes || null,
      }

      if (mode === 'search' && selectedVendor) {
        // Add existing vendor
        payload.vendorId = selectedVendor.id
      } else {
        // Create new vendor
        if (!formData.businessName || !formData.category || !formData.email || !formData.phone) {
          setError('Business name, category, email, and phone are required')
          setIsSubmitting(false)
          return
        }
        payload.ownerName = formData.ownerName
        payload.businessName = formData.businessName
        payload.category = formData.category
        payload.email = formData.email
        payload.phone = formData.phone
        payload.whatsapp = formData.whatsapp || formData.phone
        payload.address = formData.address
        payload.city = formData.city
        payload.state = formData.state
        payload.country = formData.country
        payload.description = formData.description
        payload.website = formData.website
      }

      const response = await fetch(`/api/events/${eventId}/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to add vendor')
        return
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Vendor</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('search')
                setSelectedVendor(null)
                setSearchQuery('')
                setSearchResults([])
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'search'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Search Existing
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('new')
                setSelectedVendor(null)
                setSearchQuery('')
                setSearchResults([])
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'new'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Add New Vendor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'search' ? (
              <>
                {/* Search Input */}
                <div>
                  <Input
                    label="Search Vendors"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by business name, owner name, email, or phone..."
                    disabled={isSubmitting}
                  />
                </div>

                {/* Search Results */}
                {isSearching && (
                  <div className="text-center py-4 text-gray-500">Searching...</div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.map((vendor) => (
                      <button
                        key={vendor.id}
                        type="button"
                        onClick={() => handleSelectVendor(vendor)}
                        className={`w-full text-left p-4 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors ${
                          selectedVendor?.id === vendor.id ? 'bg-purple-50 border-purple-200' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {vendor.businessName}
                              {vendor.isVerified && (
                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  Verified
                                </span>
                              )}
                            </div>
                            {vendor.ownerName && (
                              <div className="text-sm text-gray-600">{vendor.ownerName}</div>
                            )}
                            <div className="text-sm text-gray-500 mt-1">
                              {vendor.category.replace(/_/g, ' ')} • {vendor.email} • {vendor.phone}
                            </div>
                            {vendor.averageRating > 0 && (
                              <div className="text-sm text-yellow-600 mt-1">
                                ⭐ {vendor.averageRating.toFixed(1)} ({vendor.totalRatings} reviews)
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No vendors found. Try adding a new vendor instead.
                  </div>
                )}

                {selectedVendor && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">
                      Selected: {selectedVendor.businessName}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* New Vendor Form */}
                <Input
                  label="Owner Name (Optional)"
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  disabled={isSubmitting}
                />

                <Input
                  label="Business Name *"
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  required
                  disabled={isSubmitting}
                />

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Service Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Email *"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isSubmitting}
                />

                <Input
                  label="Phone Number *"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={isSubmitting}
                />

                <Input
                  label="WhatsApp Number (Optional)"
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  disabled={isSubmitting}
                  helperText="Leave blank to use phone number"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="City"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={isSubmitting}
                  />

                  <Input
                    label="State"
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                <Input
                  label="Address (Optional)"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={isSubmitting}
                />

                <Input
                  label="Website (Optional)"
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={isSubmitting}
                />
              </>
            )}

            {/* Event-specific fields */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <Input
                label="Role (Optional)"
                type="text"
                name="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={isSubmitting}
                placeholder="e.g., Primary Photographer, Backup DJ"
              />

              <div className="mt-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isSubmitting}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Event-specific notes for this vendor..."
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                isLoading={isSubmitting}
                disabled={mode === 'search' && !selectedVendor}
              >
                Add Vendor
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

