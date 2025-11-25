'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { InvitationTemplateLibrary } from '@/components/organisms/InvitationTemplateLibrary'
import { InvitationDesignEditor } from '@/components/organisms/InvitationDesignEditor'
import { InvitationDesignsList } from '@/components/organisms/InvitationDesignsList'
import { CustomInvitationUpload } from '@/components/organisms/CustomInvitationUpload'

interface Event {
  id: string
  title: string
  type: string
}

type ViewMode = 'library' | 'editor' | 'upload' | 'list'

export default function InvitationsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/events/${eventId}/invitations`)
      return
    }
    if (status === 'authenticated') {
      fetchEvent()
      
      // Check for designId in URL query params
      const designIdFromUrl = searchParams.get('designId')
      if (designIdFromUrl) {
        setSelectedDesign(designIdFromUrl)
        setViewMode('editor')
      }
    }
  }, [eventId, status, router, searchParams])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error('Failed to fetch event')
      }
      const data = await response.json()
      setEvent(data)
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setViewMode('editor')
    // If we're changing template for existing design, update it
    if (selectedDesign) {
      // The editor will handle updating the design with new template
    }
  }

  const handleCustomUpload = () => {
    setSelectedTemplate(null)
    setSelectedDesign(null)
    setViewMode('upload')
  }

  const handleUploadSuccess = (designId: string) => {
    setSelectedDesign(designId)
    setViewMode('list') // Show the list with the new design
    // Optionally, you could switch to editor mode:
    // setViewMode('editor')
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect
  }

  if (!event) {
    return (
      <DashboardLayout>
        <ErrorMessage message="Event not found" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Link href={`/events/${eventId}`}>
              <Button variant="ghost" size="sm" className="mb-4">
                ← Back to Event
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Invitations</h1>
            <p className="text-gray-600 mt-2">
              Design and send beautiful invitations for {event.title}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {viewMode === 'list' && (
          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={() => setViewMode('library')}
            >
              Choose Template
            </Button>
            <Button
              variant="outline"
              onClick={handleCustomUpload}
            >
              Upload Custom Design
            </Button>
          </div>
        )}

        {/* Content based on view mode */}
        {viewMode === 'library' && (
          <InvitationTemplateLibrary
            eventType={event.type}
            onSelectTemplate={handleTemplateSelect}
            onCancel={() => setViewMode('list')}
          />
        )}

        {viewMode === 'editor' && (selectedTemplate || selectedDesign) && (
          <InvitationDesignEditor
            eventId={eventId}
            templateId={selectedTemplate || undefined}
            designId={selectedDesign || undefined}
            onSave={() => {
              setViewMode('list')
              setSelectedTemplate(null)
              setSelectedDesign(null)
            }}
            onCancel={() => {
              if (selectedDesign) {
                setViewMode('list')
              } else {
                setViewMode('library')
              }
              setSelectedTemplate(null)
              setSelectedDesign(null)
            }}
            onChangeTemplate={() => {
              // Keep the design ID but allow selecting a new template
              setViewMode('library')
              // Don't clear selectedDesign so we can update it with new template
            }}
          />
        )}

        {viewMode === 'upload' && (
          <CustomInvitationUpload
            eventId={eventId}
            onUploadSuccess={handleUploadSuccess}
            onCancel={() => setViewMode('list')}
          />
        )}

        {viewMode === 'list' && (
          <InvitationDesignsList
            eventId={eventId}
            onEditDesign={(designId) => {
              setSelectedDesign(designId)
              setViewMode('editor')
            }}
            onCreateNew={() => setViewMode('library')}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

