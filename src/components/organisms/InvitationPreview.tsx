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
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const isGeneratingRef = useRef(false) // Use ref to prevent re-triggering
  const lastDataHashRef = useRef<string>('')

  useEffect(() => {
    // Create a hash of the design data to detect actual changes
    const dataHash = JSON.stringify({ designData, config, templateType })
    
    // Skip if data hasn't changed
    if (dataHash === lastDataHashRef.current) {
      return
    }
    
    lastDataHashRef.current = dataHash

    // Generate preview image when design data changes (lazy with debounce)
    let isMounted = true
    let timeoutId: NodeJS.Timeout | undefined

    const generatePreview = async () => {
      // Prevent multiple simultaneous generations
      if (!previewRef.current || isGeneratingRef.current) return

      isGeneratingRef.current = true
      setIsGenerating(true)
      setGenerateError(null)

      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Preview generation timeout')), 5000)
        })

        const previewPromise = generatePreviewFromElement(previewRef.current, {
          width: 400,
          height: 500,
          scale: 1.5, // Reduced scale for better performance
        })

        const dataUrl = await Promise.race([previewPromise, timeoutPromise])

        if (isMounted) {
          setPreviewImage(dataUrl)
          if (onPreviewGenerated) {
            onPreviewGenerated(dataUrl)
          }
        }
      } catch (error: any) {
        console.error('Error generating preview:', error)
        if (isMounted) {
          setGenerateError(error.message || 'Failed to generate preview')
          // Don't set preview image on error, will show live preview instead
        }
      } finally {
        if (isMounted) {
          isGeneratingRef.current = false
          setIsGenerating(false)
        }
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }

    // Debounce preview generation (longer delay for better performance)
    const debounceTimeout = setTimeout(generatePreview, 1000)
    
    return () => {
      isMounted = false
      clearTimeout(debounceTimeout)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [designData, config, templateType, onPreviewGenerated]) // Removed isGenerating from dependencies

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
      <div className="w-full aspect-[4/5] bg-white rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm relative">
        {previewImage && !generateError ? (
          <img
            src={previewImage}
            alt="Invitation Preview"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <div className="text-sm text-gray-600">Generating preview...</div>
              </div>
            )}
            <TemplateRenderer
              templateType={templateType}
              config={config}
              designData={designData}
            />
          </div>
        )}
        {generateError && (
          <div className="absolute bottom-2 left-2 right-2 text-xs text-red-600 bg-red-50 p-2 rounded">
            Preview generation failed. Showing live preview instead.
          </div>
        )}
      </div>
    </div>
  )
}

