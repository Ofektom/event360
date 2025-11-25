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
    required?: boolean
  }>
  colors: {
    primary: string
    secondary: string
    accent?: string
    background: string
    text: string
    heading?: string
    body?: string
  }
  graphics: Array<{
    id: string
    type: string
    url: string
  }>
}

interface CustomTextField {
  id: string
  label: string
  value: string
  placeholder: string
}

interface CustomGraphic {
  id: string
  url: string
  type: 'image' | 'icon'
  position?: { x: number; y: number }
  size?: { width: number; height: number }
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
  const [customFields, setCustomFields] = useState<CustomTextField[]>([])
  const [customGraphics, setCustomGraphics] = useState<CustomGraphic[]>([])
  const [showAddField, setShowAddField] = useState(false)
  const [showGraphicsManager, setShowGraphicsManager] = useState(false)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('')

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
      const savedData = data.designData || { text: {}, colors: {}, graphics: {} }
      setDesignData(savedData)
      
      // Load custom fields
      if (savedData.customFields) {
        setCustomFields(savedData.customFields)
      }
      
      // Load custom graphics
      if (savedData.customGraphics) {
        setCustomGraphics(savedData.customGraphics)
      }
      
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

  const addCustomTextField = () => {
    if (!newFieldLabel.trim()) {
      alert('Please enter a field label')
      return
    }

    const newField: CustomTextField = {
      id: `custom_${Date.now()}`,
      label: newFieldLabel,
      value: '',
      placeholder: newFieldPlaceholder || 'Enter text...',
    }

    setCustomFields([...customFields, newField])
    setDesignData({
      ...designData,
      text: {
        ...designData.text,
        [newField.id]: '',
      },
    })

    // Reset form
    setNewFieldLabel('')
    setNewFieldPlaceholder('')
    setShowAddField(false)
  }

  const removeCustomTextField = (fieldId: string) => {
    setCustomFields(customFields.filter(f => f.id !== fieldId))
    const newText = { ...designData.text }
    delete newText[fieldId]
    setDesignData({
      ...designData,
      text: newText,
    })
  }

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFields(customFields.map(f => 
      f.id === fieldId ? { ...f, value } : f
    ))
    handleTextChange(fieldId, value)
  }

  const handleGraphicUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('eventId', eventId)
      formData.append('type', 'invitation')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload graphic')
      }

      const { url } = await response.json()

      const newGraphic: CustomGraphic = {
        id: `graphic_${Date.now()}`,
        url,
        type: file.type.startsWith('image/') ? 'image' : 'icon',
      }

      setCustomGraphics([...customGraphics, newGraphic])
      setDesignData({
        ...designData,
        graphics: {
          ...designData.graphics,
          [newGraphic.id]: url,
        },
      })
    } catch (error) {
      console.error('Error uploading graphic:', error)
      alert('Failed to upload graphic. Please try again.')
    }
  }

  const removeCustomGraphic = (graphicId: string) => {
    setCustomGraphics(customGraphics.filter(g => g.id !== graphicId))
    const newGraphics = { ...designData.graphics }
    delete newGraphics[graphicId]
    setDesignData({
      ...designData,
      graphics: newGraphics,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = designId
        ? `/api/invitations/designs/${designId}`
        : `/api/invitations/designs`
      const method = designId ? 'PATCH' : 'POST'

      // Include custom fields and graphics in design data
      const saveData = {
        ...designData,
        customFields,
        customGraphics,
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          templateId: templateId || existingDesign?.templateId,
          designData: saveData,
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
  const allColors = (config?.colors || {}) as TemplateConfig['colors']
  
  // Enhanced color categories
  const themeColors = {
    primary: allColors?.primary || '#9333ea',
    secondary: allColors?.secondary || '#ec4899',
    accent: allColors?.accent || allColors?.secondary || '#ec4899',
  }
  
  const textColors = {
    heading: allColors?.heading || allColors?.text || '#111827',
    body: allColors?.body || allColors?.text || '#111827',
    text: allColors?.text || '#111827',
  }
  
  const backgroundColors = {
    background: allColors?.background || '#ffffff',
  }

  // Merge with user's custom colors
  const currentThemeColors = {
    primary: designData.colors?.primary || themeColors.primary,
    secondary: designData.colors?.secondary || themeColors.secondary,
    accent: designData.colors?.accent || themeColors.accent,
  }

  const currentTextColors = {
    heading: designData.colors?.heading || textColors.heading,
    body: designData.colors?.body || textColors.body,
    text: designData.colors?.text || textColors.text,
  }

  const currentBackgroundColors = {
    background: designData.colors?.background || backgroundColors.background,
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Editor Panel */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customize Your Invitation</h2>

        {/* Text Fields - Template Fields */}
        {config?.textFields && config.textFields.length > 0 && (
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Text Content</h3>
            </div>
            {config.textFields.map((field) => (
              <div key={field.id}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
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

        {/* Custom Text Fields */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Additional Text Fields</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddField(!showAddField)}
            >
              {showAddField ? 'Cancel' : '+ Add Field'}
            </Button>
          </div>

          {showAddField && (
            <Card className="p-4 bg-gray-50 border-2 border-dashed border-gray-300">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Label
                  </label>
                  <Input
                    type="text"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="e.g., Special Instructions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placeholder Text (optional)
                  </label>
                  <Input
                    type="text"
                    value={newFieldPlaceholder}
                    onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                    placeholder="Enter text..."
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={addCustomTextField}
                  className="w-full"
                >
                  Add Field
                </Button>
              </div>
            </Card>
          )}

          {customFields.map((field) => (
            <div key={field.id} className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                <button
                  onClick={() => removeCustomTextField(field.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                  type="button"
                >
                  Remove
                </button>
              </div>
              <Input
                type="text"
                value={field.value}
                onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        {/* Enhanced Colors - Theme Colors */}
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900">Theme Colors</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(currentThemeColors).map(([key, defaultColor]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {key}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={defaultColor}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={defaultColor}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="flex-1"
                    placeholder={defaultColor}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Text Colors */}
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900">Text Colors</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(currentTextColors).map(([key, defaultColor]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {key}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={defaultColor}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={defaultColor}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="flex-1"
                    placeholder={defaultColor}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Colors */}
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900">Background Colors</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(currentBackgroundColors).map(([key, defaultColor]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {key}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={defaultColor}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={defaultColor}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="flex-1"
                    placeholder={defaultColor}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Graphics Management */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Graphics & Icons</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGraphicsManager(!showGraphicsManager)}
            >
              {showGraphicsManager ? 'Hide' : 'Manage Graphics'}
            </Button>
          </div>

          {showGraphicsManager && (
            <Card className="p-4 bg-gray-50 border-2 border-dashed border-gray-300">
              <div className="space-y-4">
                {/* Upload Graphic */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Custom Graphic
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleGraphicUpload(file)
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload PNG, JPG, or SVG images
                  </p>
                </div>

                {/* Custom Graphics List */}
                {customGraphics.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Your Graphics:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {customGraphics.map((graphic) => (
                        <div key={graphic.id} className="relative group">
                          <img
                            src={graphic.url}
                            alt="Graphic"
                            className="w-full h-20 object-cover rounded border border-gray-300"
                          />
                          <button
                            onClick={() => removeCustomGraphic(graphic.id)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            type="button"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Template Graphics */}
                {config?.graphics && config.graphics.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Template Graphics:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {config.graphics.map((graphic) => (
                        <div key={graphic.id} className="relative">
                          <img
                            src={graphic.url}
                            alt="Graphic"
                            className="w-full h-20 object-cover rounded border border-gray-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

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
        <div className="aspect-[4/5] bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
          {existingDesign?.customImage ? (
            // Show custom uploaded image
            <img
              src={existingDesign.customImage}
              alt={existingDesign.name || 'Custom Invitation'}
              className="w-full h-full object-contain"
            />
          ) : config ? (
            // Template-based preview (will be enhanced later)
            <div className="text-center text-gray-500 p-4">
              <div className="text-4xl mb-2">📱</div>
              <p className="text-sm">Live preview will appear here</p>
              <p className="text-xs mt-1">Preview functionality coming soon</p>
              <div className="mt-4 text-left text-xs space-y-1">
                <p><strong>Colors:</strong> {Object.keys(designData.colors || {}).length} customized</p>
                <p><strong>Text Fields:</strong> {(config.textFields?.length || 0) + customFields.length}</p>
                <p><strong>Graphics:</strong> {customGraphics.length + (config.graphics?.length || 0)}</p>
              </div>
            </div>
          ) : (
            // No template or custom image
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🎨</div>
              <p className="text-sm">No preview available</p>
            </div>
          )}
        </div>
        {existingDesign?.customImage && (
          <p className="mt-4 text-sm text-gray-600 text-center">
            Custom uploaded design
          </p>
        )}
      </Card>
    </div>
  )
}
