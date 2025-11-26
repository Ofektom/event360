'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { generateSVGPreview } from '@/lib/template-preview'

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
  onSelectTemplate: (templateId: string | null) => void
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
  
  // Memoize filtered templates for better performance
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === 'all' || template.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [templates, searchQuery, selectedCategory])

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
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sm:w-48 w-full">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Blank Template Option */}
        <Card
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-gray-300"
          onClick={() => onSelectTemplate(null)}
        >
          <div className="aspect-[4/5] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-400">
              <div className="text-5xl mb-2">✨</div>
              <p className="text-sm font-medium">Start from Scratch</p>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Blank Template</h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            Create your own custom design from scratch
          </p>
          <div className="mt-3">
            <Button variant="outline" size="sm" className="w-full">
              Create Blank Design
            </Button>
          </div>
        </Card>

        {/* Template Cards */}
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <div className="text-4xl mb-4">🎨</div>
              <p className="text-gray-600 mb-2">No templates found.</p>
              <p className="text-sm text-gray-500">
                Templates need to be seeded during development setup.
              </p>
            </Card>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            // Generate preview if not available
            const previewUrl = template.preview || generateSVGPreview({
              category: template.category,
              name: template.name,
            })

            return (
              <Card
                key={template.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onSelectTemplate(template.id)}
              >
                <div className="aspect-[4/5] bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <img
                    src={previewUrl}
                    alt={template.name}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        const fallbackPreview = generateSVGPreview({
                          category: template.category,
                          name: template.name,
                        })
                        const fallbackImg = document.createElement('img')
                        fallbackImg.src = fallbackPreview
                        fallbackImg.className = 'w-full h-full object-cover rounded-lg'
                        parent.appendChild(fallbackImg)
                      }
                    }}
                  />
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
            )
          })
        )}
      </div>

      {/* Cancel Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

