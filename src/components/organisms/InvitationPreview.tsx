'use client'

import { useRef, useEffect, useState } from 'react'
import { TemplateRenderer } from '@/components/templates/invitations/TemplateRenderer'
import { generatePreviewFromElement } from '@/lib/template-renderer'

interface InvitationPreviewProps {
  templateType: string
  config: {
    textFields: Array<{
      id: string
      label: string
      placeholder: string
      default: string
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
  }
  designData: {
    text: Record<string, string>
    colors: Record<string, string>
  }
  onPreviewGenerated?: (previewUrl: string) => void
}

export function InvitationPreview({
  templateType,
  config,
  designData,
  onPreviewGenerated,
}: InvitationPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    // Generate preview image when design data changes
    const generatePreview = async () => {
      if (previewRef.current) {
        try {
          const dataUrl = await generatePreviewFromElement(previewRef.current, {
            width: 400,
            height: 500,
            scale: 2,
          })
          setPreviewImage(dataUrl)
          if (onPreviewGenerated) {
            onPreviewGenerated(dataUrl)
          }
        } catch (error) {
          console.error('Error generating preview:', error)
        }
      }
    }

    // Debounce preview generation
    const timeoutId = setTimeout(generatePreview, 500)
    return () => clearTimeout(timeoutId)
  }, [designData, config, templateType, onPreviewGenerated])

  return (
    <div className="relative">
      {/* Hidden template for rendering */}
      <div
        ref={previewRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <TemplateRenderer
          templateType={templateType}
          config={config}
          designData={designData}
        />
      </div>

      {/* Visible preview */}
      <div className="w-full aspect-[4/5] bg-white rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
        {previewImage ? (
          <img
            src={previewImage}
            alt="Invitation Preview"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <TemplateRenderer
              templateType={templateType}
              config={config}
              designData={designData}
            />
          </div>
        )}
      </div>
    </div>
  )
}

