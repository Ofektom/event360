'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card } from '@/components/atoms/Card'

interface VendorInviteAcceptanceProps {
  vendor: any
  token: string
}

export function VendorInviteAcceptance({ vendor, token }: VendorInviteAcceptanceProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [formData, setFormData] = useState({
    email: vendor.email || '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

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
      // Create user account and link to vendor
      const response = await fetch('/api/vendor/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        return
      }

      // Auto sign in
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.ok) {
        // Link vendor to user account
        const linkResponse = await fetch('/api/vendor/invite/link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        if (linkResponse.ok) {
          router.push('/vendor/dashboard')
        } else {
          setError('Failed to link vendor account')
        }
      } else {
        setError('Invalid email or password')
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
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome, {vendor.businessName}!</h2>
          <p className="text-gray-600">
            You've been invited to join gbedoo as a vendor
          </p>
        </div>

        {/* Events List */}
        {vendor.eventVendors.length > 0 && (
          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Your Events:</h3>
            <ul className="space-y-1">
              {vendor.eventVendors.map((ev: any) => (
                <li key={ev.id} className="text-sm text-gray-700">
                  • {ev.event.title}
                  {ev.event.startDate && (
                    <span className="text-gray-500 ml-2">
                      ({new Date(ev.event.startDate).toLocaleDateString()})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError('')
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'signup'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError('')
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'login'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Already Have Account
          </button>
        </div>

        <form onSubmit={mode === 'signup' ? handleSignup : handleLogin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            helperText={mode === 'signup' ? 'Must be at least 8 characters' : undefined}
          />

          {mode === 'signup' && (
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
          )}

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
            {mode === 'signup' ? 'Create Account & Join' : 'Login & Link Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            By continuing, you agree to manage your vendor profile and events on gbedoo
          </p>
        </div>
      </div>
    </Card>
  )
}

