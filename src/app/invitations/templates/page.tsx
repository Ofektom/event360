'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { BackButton } from '@/components/shared/BackButton'
import Link from 'next/link'
import Image from 'next/image'

interface Template {
  id: string
  name: string
  description: string | null
  thumbnailUrl: string | null
  category: string | null
}

export default function InvitationTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/invitations/templates')
        if (!response.ok) throw new Error('Failed to fetch templates')
        const data = await response.json()
        setTemplates(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load templates')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorMessage message={error} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton href="/invitations" />
        <h1 className="text-3xl font-bold text-gray-900">Invitation Templates</h1>
        
        {templates.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600">No templates available yet.</p>
            <Link href="/invitations/design">
              <Button variant="primary" className="mt-4">
                Create Custom Design
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {template.thumbnailUrl && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={template.thumbnailUrl}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {template.description}
                    </p>
                  )}
                  <Link href={`/invitations/design?templateId=${template.id}`}>
                    <Button variant="primary" className="w-full">
                      Use Template
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

