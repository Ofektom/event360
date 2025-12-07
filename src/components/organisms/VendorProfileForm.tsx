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

interface VendorProfileFormProps {
  vendor: any
}

export function VendorProfileForm({ vendor }: VendorProfileFormProps) {
  const [formData, setFormData] = useState({
    ownerName: vendor.ownerName || '',
    businessName: vendor.businessName || '',
    category: vendor.category || '',
    description: vendor.description || '',
    email: vendor.email || '',
    phone: vendor.phone || '',
    whatsapp: vendor.whatsapp || '',
    website: vendor.website || '',
    address: vendor.address || '',
    city: vendor.city || '',
    state: vendor.state || '',
    country: vendor.country || '',
    instagram: (vendor.socialMedia as any)?.instagram || '',
    facebook: (vendor.socialMedia as any)?.facebook || '',
    twitter: (vendor.socialMedia as any)?.twitter || '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          socialMedia: {
            instagram: formData.instagram,
            facebook: formData.facebook,
            twitter: formData.twitter,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update profile')
        return
      }

      setSuccess('Profile updated successfully!')
      // Refresh page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <Input
              label="Owner Name *"
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />

            <Input
              label="Business Name *"
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Service Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={isLoading}
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

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Business Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={isLoading}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe your business and services..."
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <Input
              label="Email *"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />

            <Input
              label="Phone Number *"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={isLoading}
            />

            <Input
              label="WhatsApp Number"
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              disabled={isLoading}
              helperText="If different from phone number"
            />

            <Input
              label="Website"
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
          <div className="space-y-4">
            <Input
              label="Address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={isLoading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="City"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={isLoading}
              />

              <Input
                label="State"
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <Input
              label="Country"
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Social Media */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Media</h2>
          <div className="space-y-4">
            <Input
              label="Instagram"
              type="text"
              name="instagram"
              value={formData.instagram}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="@username"
            />

            <Input
              label="Facebook"
              type="text"
              name="facebook"
              value={formData.facebook}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Page name or URL"
            />

            <Input
              label="Twitter/X"
              type="text"
              name="twitter"
              value={formData.twitter}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="@username"
            />
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
          Update Profile
        </Button>
      </form>
    </Card>
  )
}

