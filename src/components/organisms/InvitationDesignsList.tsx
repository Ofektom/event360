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

  // Refresh designs when window regains focus (user returns from editor)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Refreshing designs list...')
      fetchDesigns()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
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
      
      // Log image URLs for debugging
      data.forEach((design: InvitationDesign) => {
        if (design.imageUrl || design.customImage) {
          console.log(`🖼️ Design "${design.name}" has image:`, design.imageUrl || design.customImage)
        } else {
          console.warn(`⚠️ Design "${design.name}" has NO image`)
        }
      })
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

  const handleShareDesign = (design: InvitationDesign) => {
    // Get the event ID from the current URL or pass it as a prop
    const eventId = window.location.pathname.split('/')[2]
    const shareUrl = `${window.location.origin}/events/${eventId}/send-invitations?designId=${design.id}`
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share link copied to clipboard!')
    }).catch(() => {
      // Fallback: show share dialog
      if (navigator.share) {
        navigator.share({
          title: design.name || 'Invitation Design',
          text: `Check out this invitation design: ${design.name || 'Untitled Design'}`,
          url: shareUrl,
        }).catch(() => {
          // User cancelled or error
        })
      } else {
        // Fallback: show URL in prompt
        prompt('Share this design:', shareUrl)
      }
    })
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Your Invitation Designs
        </h2>
        <Button variant="primary" onClick={onCreateNew} className="w-full sm:w-auto">
          + Create New Design
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {designs.map((design) => (
          <Card
            key={design.id}
            className="p-4 hover:shadow-lg transition-shadow relative group"
          >
            {/* Action buttons - appear on hover */}
            <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Edit button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditDesign(design.id)
                }}
                className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
                title="Edit design"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              
              {/* Share button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleShareDesign(design)
                }}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                title="Share design"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              
              {/* Delete button */}
              <button
                onClick={(e) => handleDelete(design.id, e)}
                disabled={deletingId === design.id}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 transition-colors"
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
            </div>

            {/* Preview Image - Show full image with proper sizing */}
            <div className="aspect-[4/5] bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
              {design.imageUrl || design.customImage ? (
                <img
                  src={design.imageUrl || design.customImage || ''}
                  alt={design.name || 'Invitation'}
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    console.error('Failed to load design image:', design.imageUrl || design.customImage)
                    // Fallback to placeholder
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : design.template?.preview ? (
                <img
                  src={design.template.preview}
                  alt={design.template.name}
                  className="w-full h-full object-contain rounded-lg"
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

