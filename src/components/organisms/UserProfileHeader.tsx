'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { FormField } from '@/components/molecules/FormField'

interface User {
  id: string
  name: string | null
  email: string
  phone: string | null
  image: string | null
  role: string
  createdAt: string
}

interface Stats {
  eventsCreated: number
  eventsInvited: number
  mediaUploaded: number
  interactionsMade: number
}

interface UserProfileHeaderProps {
  user: User
  stats: Stats
}

export function UserProfileHeader({ user, stats }: UserProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
    })
    setIsEditing(false)
    setMessage(null)
  }

  return (
    <Card className="p-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || user.email}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <FormField label="Name">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                />
              </FormField>
              <FormField label="Phone">
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Your phone number"
                />
              </FormField>
              {message && (
                <div
                  className={`p-3 rounded ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  {message.text}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  isLoading={loading}
                  disabled={loading}
                >
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {user.name || 'User'}
                  </h1>
                  <p className="text-gray-600">{user.email}</p>
                  {user.phone && (
                    <p className="text-gray-600 text-sm mt-1">{user.phone}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-2">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

