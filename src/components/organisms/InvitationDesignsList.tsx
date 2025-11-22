'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface InvitationDesign {
  id: string
  name: string | null
  templateId: string | null
  imageUrl: string | null
  customImage: string | null
  isDefault: boolean
  isActive: boolean
  template: {
    id: string
    name: string
    preview: string | null
  } | null
}

interface InvitationDesignsListProps {
  eventId: string
  onEditDesign: (designId: string) => void
  onCreateNew: () => void
}

export function InvitationDesignsList({
  eventId,
  onEditDesign,
  onCreateNew,
}: InvitationDesignsListProps) {
  const [designs, setDesigns] = useState<InvitationDesign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDesigns()
  }, [eventId])

  const fetchDesigns = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invitations/designs?eventId=${eventId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch designs')
      }
      const data = await response.json()
      setDesigns(data)
    } catch (error) {
      console.error('Error fetching designs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (designs.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Your Invitation Designs
        </h2>
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📨</div>
          <p>No invitation designs yet.</p>
          <p className="text-sm mt-2 mb-4">
            Choose a template or upload your own design to get started.
          </p>
          <Button variant="primary" onClick={onCreateNew}>
            Create Your First Design
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Your Invitation Designs
        </h2>
        <Button variant="primary" onClick={onCreateNew}>
          + Create New Design
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designs.map((design) => (
          <Card
            key={design.id}
            className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onEditDesign(design.id)}
          >
            <div className="aspect-[4/5] bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-4 flex items-center justify-center">
              {design.imageUrl || design.customImage ? (
                <img
                  src={design.imageUrl || design.customImage || ''}
                  alt={design.name || 'Invitation'}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : design.template?.preview ? (
                <img
                  src={design.template.preview}
                  alt={design.template.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">🎨</div>
                  <p className="text-sm">Preview</p>
                </div>
              )}
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {design.name || 'Untitled Design'}
                </h3>
                {design.template && (
                  <p className="text-xs text-gray-500">
                    Based on: {design.template.name}
                  </p>
                )}
              </div>
              {design.isDefault && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                  Default
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
}

