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

    // Reset preview image when data changes (show live preview first)
    setPreviewImage(null)
    setGenerateError(null)

    // Generate preview image when design data changes (lazy with debounce)
    // Only generate if html2canvas is available and element is ready
    let isMounted = true
    let timeoutId: NodeJS.Timeout | undefined

    const generatePreview = async () => {
      // Prevent multiple simultaneous generations
      if (!previewRef.current || isGeneratingRef.current) return
      
      // Wait a bit for the DOM to render
      await new Promise(resolve => setTimeout(resolve, 300))

      isGeneratingRef.current = true
      setIsGenerating(true)

      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Preview generation timeout')), 8000)
        })

        const previewPromise = generatePreviewFromElement(previewRef.current, {
          width: 400,
          height: 500,
          scale: 1.5, // Reduced scale for better performance
        })

        const dataUrl = await Promise.race([previewPromise, timeoutPromise])

        if (isMounted && dataUrl && typeof dataUrl === 'string') {
          // Verify the image is not just white/empty (basic check)
          if (dataUrl.length > 500 && !dataUrl.includes('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')) {
            setPreviewImage(dataUrl)
            if (onPreviewGenerated) {
              onPreviewGenerated(dataUrl)
            }
          } else {
            console.warn('Generated preview appears to be empty or invalid')
            // Don't set error, just keep showing live preview
          }
        }
      } catch (error: any) {
        console.error('Error generating preview:', error)
        // Don't show error to user, just keep live preview
        // Preview generation is optional
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
    const debounceTimeout = setTimeout(generatePreview, 1500)
    
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
          top: 0,
          width: '400px',
          height: '500px',
          opacity: 1, // Keep visible for html2canvas
          pointerEvents: 'none',
          zIndex: -1,
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
            onError={() => {
              // Fallback to live preview if image fails to load
              setPreviewImage(null)
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 relative overflow-auto" style={{ minHeight: '500px' }}>
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Generating preview...</div>
                  <div className="text-xs text-gray-500">This may take a few seconds</div>
                </div>
              </div>
            )}
            <div className="w-full h-full flex items-center justify-center p-4" style={{ maxWidth: '400px', maxHeight: '500px' }}>
              <TemplateRenderer
                templateType={templateType}
                config={config}
                designData={designData}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

