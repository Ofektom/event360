'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
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

export function VendorSignupForm() {
  const router = useRouter()
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
    country: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.ownerName || !formData.businessName || !formData.category || !formData.email || !formData.phone) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup/vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerName: formData.ownerName,
          businessName: formData.businessName,
          category: formData.category,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.whatsapp || formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country || 'Nigeria',
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create vendor account')
        return
      }

      // Auto sign in after successful signup
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (signInResult?.ok) {
        router.push('/vendor/dashboard')
      } else {
        router.push('/auth/signin?registered=true&type=vendor')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 text-center">Become a Verified Vendor</h2>
          <p className="text-sm text-gray-600 text-center">
            Join our platform and connect with event creators
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Owner Name */}
          <Input
            label="Owner Name *"
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            required
            disabled={isLoading}
            placeholder="e.g., John Doe"
          />

          {/* Business Name */}
          <Input
            label="Business Name *"
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            required
            disabled={isLoading}
            placeholder="e.g., Elegant Events Co."
          />

          {/* Category */}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
            >
              <option value="">Select a category</option>
              {VENDOR_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Email */}
          <Input
            label="Email *"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
            autoComplete="email"
            placeholder="your@email.com"
          />

          {/* Phone */}
          <Input
            label="Phone Number *"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            disabled={isLoading}
            placeholder="+234 800 000 0000"
          />

          {/* WhatsApp */}
          <Input
            label="WhatsApp Number (Optional)"
            type="tel"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Leave blank to use phone number"
            helperText="If different from phone number"
          />

          {/* Location Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="City"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="e.g., Lagos"
            />

            <Input
              label="State"
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="e.g., Lagos State"
            />
          </div>

          <Input
            label="Address (Optional)"
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Street address"
          />

          <Input
            label="Country"
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Nigeria"
          />

          {/* Password */}
          <Input
            label="Password *"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
            autoComplete="new-password"
            helperText="Must be at least 8 characters"
          />

          <Input
            label="Confirm Password *"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={isLoading}
            autoComplete="new-password"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Create Vendor Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a
              href="/auth/signin"
              className="text-[var(--theme-primary)] hover:underline font-medium"
            >
              Sign in
            </a>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Are you an event creator?{' '}
            <a
              href="/auth/signup"
              className="text-[var(--theme-primary)] hover:underline font-medium"
            >
              Sign up as event creator
            </a>
          </p>
        </div>
      </div>
    </Card>
  )
}

