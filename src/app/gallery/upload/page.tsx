'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { BackButton } from '@/components/shared/BackButton'
import { MediaUploadModal } from '@/components/organisms/MediaUploadModal'

export default function UploadPhotosPage() {
  const router = useRouter()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton href="/gallery" />
        <h1 className="text-3xl font-bold text-gray-900">Upload Photos</h1>
        
        <Card className="p-6">
          <div className="space-y-4">
            <p className="text-gray-600">
              Select an event to upload photos to, or upload to the general gallery.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Event (Optional)
              </label>
              <Input
                type="text"
                placeholder="Event ID or search for event..."
                onChange={(e) => setSelectedEventId(e.target.value || null)}
              />
            </div>

            <Button
              variant="primary"
              onClick={() => setShowUploadModal(true)}
              className="w-full"
            >
              Open Upload Dialog
            </Button>
          </div>
        </Card>

        {showUploadModal && selectedEventId && (
          <MediaUploadModal
            eventId={selectedEventId}
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => {
              setShowUploadModal(false)
              router.push('/gallery')
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

