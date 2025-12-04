'use client'

import { useState, useRef, useEffect } from 'react'
import { TemplateRenderer } from '@/components/templates/invitations/TemplateRenderer'
import { generatePreviewFromElement } from '@/lib/template-renderer'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/atoms/Card'

export default function GenerateTemplatePlaceholderPage() {
  const [generating, setGenerating] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Elegant Wedding template config - matching the seed template structure
  const sampleConfig = {
    textFields: [
      {
        id: 'bride_name',
        label: 'Bride Name',
        placeholder: 'Enter bride name',
        default: 'Sarah',
      },
      {
        id: 'groom_name',
        label: 'Groom Name',
        placeholder: 'Enter groom name',
        default: 'John',
      },
      {
        id: 'date',
        label: 'Wedding Date',
        placeholder: 'Enter wedding date',
        default: 'Saturday, January 1, 2025',
      },
      {
        id: 'venue',
        label: 'Venue',
        placeholder: 'Enter venue name',
        default: '123 Main Street, City',
      },
      {
        id: 'message',
        label: 'Personal Message',
        placeholder: 'Add a personal message',
        default: 'You are cordially invited to celebrate with us',
      },
    ],
    colors: {
      primary: '#9333ea',
      secondary: '#ec4899',
      accent: '#ec4899',
      background: '#ffffff',
      text: '#111827',
      heading: '#111827',
      body: '#4b5563',
    },
  }

  // Sample design data with placeholder content for wedding
  const sampleDesignData = {
    text: {
      bride_name: 'Sarah',
      groom_name: 'John',
      date: 'Saturday, January 1, 2025',
      venue: '123 Main Street, City',
      message: 'You are cordially invited to celebrate with us',
    },
    colors: {
      primary: '#9333ea',
      secondary: '#ec4899',
      accent: '#ec4899',
      background: '#ffffff',
      text: '#111827',
      heading: '#111827',
      body: '#4b5563',
    },
    styles: {
      fontSize: {
        heading: 32,
        subheading: 24,
        body: 16,
      },
      spacing: {
        padding: 40,
        margin: {
          top: 20,
          bottom: 20,
        },
      },
    },
    orientation: 'portrait' as const,
  }

  const generateImage = async () => {
    if (!previewRef.current) {
      alert('Preview element not found')
      return
    }

    setGenerating(true)
    try {
      // Wait a bit for DOM to settle and images to load
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generate image with high quality (800x1200 for portrait)
      const dataUrl = await generatePreviewFromElement(previewRef.current, {
        width: 800,
        height: 1200,
        scale: 2, // High quality (2x for retina)
      })

      setImageDataUrl(dataUrl)
      console.log('✅ Image generated successfully! Size:', dataUrl.length, 'bytes')
    } catch (error) {
      console.error('❌ Error generating image:', error)
      alert('Failed to generate image. Check console for details.')
    } finally {
      setGenerating(false)
    }
  }

  const downloadImage = () => {
    if (!imageDataUrl) return

    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = imageDataUrl
    link.download = 'whatsapp-template-placeholder.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Auto-generate on mount
  useEffect(() => {
    // Wait for component to mount and render
    const timer = setTimeout(() => {
      if (previewRef.current && !imageDataUrl) {
        generateImage()
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Card className="p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Generate WhatsApp Template Placeholder Image</h1>
          <p className="text-gray-600 mb-4">
            This page generates a sample wedding invitation image using the Elegant Wedding template. 
            You can use this as a placeholder when creating your WhatsApp message template in SendZen.
          </p>
          <div className="flex gap-4 mb-4">
            <Button onClick={generateImage} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Image'}
            </Button>
            {imageDataUrl && (
              <Button onClick={downloadImage} variant="secondary">
                Download Image
              </Button>
            )}
          </div>
          {generating && (
            <div className="text-sm text-gray-600">
              ⏳ Generating high-quality image... This may take a few seconds.
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
            <div 
              className="border-2 border-gray-200 rounded-lg p-4 bg-white overflow-auto"
              style={{ maxHeight: '600px' }}
            >
              <div
                ref={previewRef}
                style={{
                  width: '800px',
                  height: '1200px',
                  position: 'relative',
                  backgroundColor: '#ffffff',
                }}
              >
                <TemplateRenderer
                  templateType="Elegant Wedding"
                  config={sampleConfig}
                  designData={sampleDesignData}
                />
              </div>
            </div>
          </Card>

          {/* Generated Image Preview */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Generated Image</h2>
            {imageDataUrl ? (
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                <img
                  src={imageDataUrl}
                  alt="Generated placeholder"
                  className="w-full h-auto rounded shadow-lg"
                />
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    ✅ Image generated successfully!
                  </p>
                  <p className="text-sm text-gray-700">
                    Click "Download Image" to save this file, then upload it to SendZen as your template header image.
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-2 border-gray-200 rounded-lg p-8 bg-gray-50 text-center">
                <p className="text-gray-500">
                  {generating ? 'Generating image...' : 'Click "Generate Image" to create the placeholder'}
                </p>
              </div>
            )}
          </Card>
        </div>

        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>The image will auto-generate when the page loads (wait a few seconds)</li>
            <li>Review the generated image in the preview</li>
            <li>Click "Download Image" to save <code className="bg-gray-100 px-1 rounded">whatsapp-template-placeholder.png</code> to your computer</li>
            <li>Go to SendZen Template Management → Create New Template</li>
            <li>When creating your template, upload this image as the header image</li>
            <li><strong>Important:</strong> This is just a placeholder for template approval. The actual invitation images will be provided dynamically via API when sending messages.</li>
          </ol>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The template uses sample data (Sarah & John's Wedding). 
              When you send actual invitations via API, each recipient will receive their personalized invitation design image.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

