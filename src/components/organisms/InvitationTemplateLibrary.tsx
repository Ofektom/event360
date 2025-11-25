'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface InvitationTemplate {
  id: string
  name: string
  description: string | null
  category: string
  preview: string | null
  isDefault: boolean
}

interface InvitationTemplateLibraryProps {
  eventType: string
  onSelectTemplate: (templateId: string) => void
  onCancel: () => void
}

export function InvitationTemplateLibrary({
  eventType,
  onSelectTemplate,
  onCancel,
}: InvitationTemplateLibraryProps) {
  const [templates, setTemplates] = useState<InvitationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchTemplates()
  }, [eventType])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invitations/templates?category=${eventType.toLowerCase()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', 'wedding', 'birthday', 'corporate', 'celebration', 'other']
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">🎨</div>
          <p className="text-gray-600 mb-2">No templates found.</p>
          <p className="text-sm text-gray-500">
            Templates need to be seeded during development setup.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectTemplate(template.id)}
            >
              <div className="aspect-[4/5] bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-4 flex items-center justify-center">
                {template.preview ? (
                  <img
                    src={template.preview}
                    alt={template.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">🎨</div>
                    <p className="text-sm">Preview</p>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
              {template.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
              )}
              <div className="mt-3">
                <Button variant="primary" size="sm" className="w-full">
                  Use This Template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

