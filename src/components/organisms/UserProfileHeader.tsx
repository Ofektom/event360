'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { FormField } from '@/components/molecules/FormField'
import { updateCachedUserProfile } from '@/lib/user-cache'

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
  const router = useRouter()
  
  if (!user) {
    return (
      <Card className="p-8">
        <p className="text-gray-600">User data not available</p>
      </Card>
    )
  }

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    image: user.image || '',
  })
  const [previewImage, setPreviewImage] = useState<string | null>(user.image || null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        image: user.image || '',
      })
      setPreviewImage(user.image || null)
    }
  }, [user])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    // Validate file size (max 5MB for profile pictures)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' })
      return
    }

    setUploadingImage(true)
    setMessage(null)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const uploadResponse = await fetch('/api/user/profile/picture', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload profile picture')
      }

      const uploadResult = await uploadResponse.json()

      // Update form data with new image URL
      const newImageUrl = uploadResult.url
      setFormData({ ...formData, image: newImageUrl })
      setPreviewImage(newImageUrl)
      
      // Update cache with new image
      updateCachedUserProfile({
        image: newImageUrl,
      })
      
      setMessage({ type: 'success', text: 'Profile picture uploaded successfully! Please save to update your profile.' })
    } catch (error: any) {
      console.error('Error uploading image:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to upload profile picture' })
      setPreviewImage(user.image)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          image: formData.image || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update profile')
      }

      const result = await response.json()
      
      // Update cache with new profile data
      if (result.user) {
        updateCachedUserProfile({
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          image: result.user.image,
          phone: result.user.phone,
          role: result.user.role,
        })
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
      
      // Refresh the page data using Next.js router
      router.refresh()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to update profile. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    try {
      setFormData({
        name: user?.name || '',
        phone: user?.phone || '',
        image: user?.image || '',
      })
      setPreviewImage(user?.image || null)
      setIsEditing(false)
      setMessage(null)
    } catch (error) {
      console.error('Error canceling edit:', error)
      setIsEditing(false)
    }
  }

  return (
    <Card className="p-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
              {previewImage && previewImage.trim() !== '' && previewImage !== 'null' ? (
                previewImage.startsWith('data:') ? (
                  // Use regular img tag for data URLs
                  <img
                    src={previewImage}
                    alt={formData.name || user.email || 'Profile'}
                    className="w-full h-full object-cover"
                    onError={() => {
                      setPreviewImage(null)
                    }}
                  />
                ) : (
                  <Image
                    src={previewImage}
                    alt={formData.name || user.email || 'Profile'}
                    fill
                    className="object-cover"
                    onError={() => {
                      setPreviewImage(null)
                    }}
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                  {(formData.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {isEditing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Change profile picture"
                >
                  {uploadingImage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <FormField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <FormField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Your phone number"
              />
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
                    Member since {new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    try {
                      setIsEditing(true)
                    } catch (error) {
                      console.error('Error entering edit mode:', error)
                    }
                  }}
                >
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

