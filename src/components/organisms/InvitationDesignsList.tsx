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
  onDeleteDesign?: (designId: string) => void
}

export function InvitationDesignsList({
  eventId,
  onEditDesign,
  onCreateNew,
  onDeleteDesign,
}: InvitationDesignsListProps) {
  const [designs, setDesigns] = useState<InvitationDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  const handleDelete = async (designId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    
    if (!confirm('Are you sure you want to delete this invitation design? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(designId)
      const response = await fetch(`/api/invitations/designs/${designId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete design')
      }

      // Remove from list
      setDesigns(designs.filter(d => d.id !== designId))
      
      // Call callback if provided
      if (onDeleteDesign) {
        onDeleteDesign(designId)
      }
    } catch (error) {
      console.error('Error deleting design:', error)
      alert('Failed to delete design. Please try again.')
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
            className="p-4 hover:shadow-lg transition-shadow cursor-pointer relative group"
            onClick={() => onEditDesign(design.id)}
          >
            {/* Delete button - appears on hover */}
            <button
              onClick={(e) => handleDelete(design.id, e)}
              disabled={deletingId === design.id}
              className="absolute top-2 right-2 z-10 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
              title="Delete design"
            >
              {deletingId === design.id ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>

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
              <div className="flex-1">
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
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded ml-2">
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

