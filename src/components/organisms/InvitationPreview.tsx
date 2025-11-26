'use client'

import { useRef, useEffect, useState } from 'react'
import { TemplateRenderer } from '@/components/templates/invitations/TemplateRenderer'
import { generatePreviewFromElement } from '@/lib/template-renderer'

interface InvitationPreviewProps {
  templateType: string
  config?: {
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
    styles?: {
      fontSize?: {
        heading?: number
        subheading?: number
        body?: number
      }
      spacing?: {
        padding?: number
        margin?: {
          top?: number
          bottom?: number
        }
      }
    }
    shapes?: Array<{
      id: string
      name: string
      svgPath: string
      color: string
      position: { x: number; y: number }
      size: { width: number; height: number }
    }>
    textBoxes?: Array<{
      id: string
      text: string
      position: { x: number; y: number }
      size: { width: number; height: number }
      fontSize: number
      color: string
      backgroundColor?: string
      hasFill: boolean
      fontFamily?: string
      fontWeight?: string
      textAlign?: 'left' | 'center' | 'right'
    }>
    orientation?: 'portrait' | 'landscape'
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
  const isGeneratingRef = useRef(false)
  const lastDataHashRef = useRef<string>('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const generationTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Create a stable hash of the design data to detect actual changes
    // Include text, colors, and styles to detect font size changes
    const dataHash = JSON.stringify({ 
      text: designData?.text || {},
      colors: designData?.colors || {},
      styles: designData?.styles || {},
      templateType 
    })
    
    // Skip if data hasn't changed
    if (dataHash === lastDataHashRef.current) {
      return
    }
    
    lastDataHashRef.current = dataHash

    // Clear any pending generation
    if (generationTimerRef.current) {
      clearTimeout(generationTimerRef.current)
      generationTimerRef.current = null
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    // Don't reset preview image immediately - keep showing it while editing
    // Only clear if we're actually going to regenerate

    // Generate preview image only after user stops editing (long debounce)
    // This prevents constant regeneration during typing
    let isMounted = true

    const scheduleGeneration = () => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Schedule new generation with longer delay (5 seconds after last change)
      debounceTimerRef.current = setTimeout(() => {
        if (!isMounted || isGeneratingRef.current) return

        const generatePreview = async () => {
          // Prevent multiple simultaneous generations
          if (!previewRef.current || isGeneratingRef.current) return
          
          // Wait for DOM to be fully rendered
          await new Promise(resolve => setTimeout(resolve, 500))

          // Double-check we're still mounted and not already generating
          if (!isMounted || isGeneratingRef.current || !previewRef.current) return

          isGeneratingRef.current = true
          setIsGenerating(true)

          let timeoutId: NodeJS.Timeout | undefined

          try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise<never>((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error('Preview generation timeout')), 10000)
            })

            const previewPromise = generatePreviewFromElement(previewRef.current, {
              width: 400,
              height: 500,
              scale: 1.5,
            })

            const dataUrl = await Promise.race([previewPromise, timeoutPromise])

            if (isMounted && dataUrl && typeof dataUrl === 'string') {
              // Verify the image is valid
              if (dataUrl.length > 500) {
                setPreviewImage(dataUrl)
                if (onPreviewGenerated) {
                  onPreviewGenerated(dataUrl)
                }
              }
            }
          } catch (error: any) {
            console.error('Error generating preview:', error)
            // Silently fail - live preview is always available
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

        generatePreview()
      }, 5000) // 5 second delay after user stops editing
    }

    scheduleGeneration()
    
    return () => {
      isMounted = false
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      if (generationTimerRef.current) {
        clearTimeout(generationTimerRef.current)
        generationTimerRef.current = null
      }
    }
  }, [designData, templateType, onPreviewGenerated]) // Removed config from dependencies to reduce churn

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

      {/* Visible preview - Always show live preview, static preview is optional */}
      <div 
        className="w-full bg-white rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm relative"
        style={{
          aspectRatio: designData.orientation === 'landscape' ? '3/2' : '4/5',
          minHeight: designData.orientation === 'landscape' ? '400px' : '500px',
        }}
      >
        {/* Show static preview if available and not generating */}
        {previewImage && !isGenerating ? (
          <div className="relative w-full h-full">
            <img
              src={previewImage}
              alt="Invitation Preview"
              className="w-full h-full object-contain"
              onError={() => {
                // Fallback to live preview if image fails to load
                setPreviewImage(null)
              }}
            />
            {/* Overlay indicator that this is a static preview */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              Static Preview
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 relative overflow-auto" style={{ minHeight: '500px' }}>
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Generating static preview...</div>
                  <div className="text-xs text-gray-500">This may take a few seconds</div>
                </div>
              </div>
            )}
            {/* Live preview - always visible */}
            <div className="w-full h-full flex items-center justify-center p-2 sm:p-4" style={{ maxWidth: '100%', maxHeight: '500px' }}>
              <TemplateRenderer
                templateType={templateType}
                config={config}
                designData={designData}
              />
            </div>
            {/* Indicator that this is live preview */}
            {!isGenerating && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                Live Preview
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

