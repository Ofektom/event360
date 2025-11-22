'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface InvitationDesignEditorProps {
  eventId: string
  templateId?: string
  designId?: string
  onSave: () => void
  onCancel: () => void
}

interface TemplateConfig {
  textFields: Array<{
    id: string
    label: string
    placeholder: string
    default: string
  }>
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
  }
  graphics: Array<{
    id: string
    type: string
    url: string
  }>
}

export function InvitationDesignEditor({
  eventId,
  templateId,
  designId,
  onSave,
  onCancel,
}: InvitationDesignEditorProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<any>(null)
  const [existingDesign, setExistingDesign] = useState<any>(null)
  const [designData, setDesignData] = useState<any>({
    text: {},
    colors: {},
    graphics: {},
  })

  useEffect(() => {
    if (designId) {
      fetchDesign()
    } else if (templateId) {
      fetchTemplate()
    }
  }, [templateId, designId])

  const fetchDesign = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invitations/designs/${designId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch design')
      }
      const data = await response.json()
      setExistingDesign(data)
      setDesignData(data.designData || { text: {}, colors: {}, graphics: {} })
      
      // Fetch template if design has one
      if (data.templateId) {
        await fetchTemplate(data.templateId)
      }
    } catch (error) {
      console.error('Error fetching design:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplate = async (id?: string) => {
    const templateIdToFetch = id || templateId
    if (!templateIdToFetch) return

    try {
      const response = await fetch(`/api/invitations/templates/${templateIdToFetch}`)
      if (!response.ok) {
        throw new Error('Failed to fetch template')
      }
      const data = await response.json()
      setTemplate(data)

      // Initialize design data with template defaults if not editing existing design
      if (!existingDesign && data.config) {
        const config = data.config as TemplateConfig
        setDesignData({
          text: config.textFields?.reduce((acc, field) => {
            acc[field.id] = field.default || ''
            return acc
          }, {} as Record<string, string>) || {},
          colors: config.colors || {},
          graphics: config.graphics?.reduce((acc, graphic) => {
            acc[graphic.id] = graphic.url
            return acc
          }, {} as Record<string, string>) || {},
        })
      }
    } catch (error) {
      console.error('Error fetching template:', error)
    }
  }

  const handleTextChange = (fieldId: string, value: string) => {
    setDesignData({
      ...designData,
      text: {
        ...designData.text,
        [fieldId]: value,
      },
    })
  }

  const handleColorChange = (colorKey: string, value: string) => {
    setDesignData({
      ...designData,
      colors: {
        ...designData.colors,
        [colorKey]: value,
      },
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = designId
        ? `/api/invitations/designs/${designId}`
        : `/api/invitations/designs`
      const method = designId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          templateId: templateId || existingDesign?.templateId,
          designData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save design')
      }

      onSave()
    } catch (error) {
      console.error('Error saving design:', error)
      alert('Failed to save design. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  const config = template?.config as TemplateConfig | undefined

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Editor Panel */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customize Your Invitation</h2>

        {/* Text Fields */}
        {config?.textFields && config.textFields.length > 0 && (
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900">Text Content</h3>
            {config.textFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                </label>
                <Input
                  type="text"
                  value={designData.text[field.id] || ''}
                  onChange={(e) => handleTextChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
        )}

        {/* Colors */}
        {config?.colors && (
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900">Colors</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(config.colors).map(([key, defaultColor]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={designData.colors[key] || defaultColor}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={designData.colors[key] || defaultColor}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="flex-1"
                      placeholder={defaultColor}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            disabled={saving}
            className="flex-1"
          >
            Save Design
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </Card>

      {/* Preview Panel */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Preview</h2>
        <div className="aspect-[4/5] bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📱</div>
            <p className="text-sm">Live preview will appear here</p>
            <p className="text-xs mt-1">Preview functionality coming soon</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

