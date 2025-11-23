'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import Image from 'next/image'

interface MediaUploadModalProps {
  eventId: string
  onClose: () => void
  onSuccess?: () => void
}

export function MediaUploadModal({ eventId, onClose, onSuccess }: MediaUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [captions, setCaptions] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const mediaFiles = Array.from(selectedFiles).filter((file) =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    )

    setFiles((prev) => [...prev, ...mediaFiles])
    setError(null)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    const fileId = files[index].name
    setCaptions((prev) => {
      const newCaptions = { ...prev }
      delete newCaptions[fileId]
      return newCaptions
    })
  }

  const handleCaptionChange = (fileId: string, caption: string) => {
    setCaptions((prev) => ({ ...prev, [fileId]: caption }))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // TODO: Upload files to storage service (S3, Cloudinary, etc.)
      // For now, we'll create a placeholder implementation
      // In production, you'd upload to your storage service first, then create media assets

      const uploadPromises = files.map(async (file) => {
        // Create a FormData for file upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('eventId', eventId)
        formData.append('caption', captions[file.name] || '')
        formData.append('type', file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO')

        // Upload file (this would go to your file upload API)
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const uploadData = await uploadResponse.json()

        // Create media asset record
        const mediaResponse = await fetch(`/api/events/${eventId}/media`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
            url: uploadData.url,
            thumbnailUrl: uploadData.thumbnailUrl,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            caption: captions[file.name] || null,
            source: 'UPLOAD',
          }),
        })

        if (!mediaResponse.ok) {
          throw new Error(`Failed to create media asset for ${file.name}`)
        }

        return mediaResponse.json()
      })

      await Promise.all(uploadPromises)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Failed to upload media')
    } finally {
      setIsUploading(false)
    }
  }

  const getPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upload Media</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* File Input */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                Select Images or Videos
              </Button>
            </div>

            {/* File Previews */}
            {files.length > 0 && (
              <div className="space-y-4">
                {files.map((file, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-4">
                      {/* Preview */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {file.type.startsWith('image/') ? (
                          <Image
                            src={getPreviewUrl(file)}
                            alt={file.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* File Info and Caption */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate mb-2">
                          {file.name}
                        </p>
                        <Input
                          label="Caption (optional)"
                          value={captions[file.name] || ''}
                          onChange={(e) => handleCaptionChange(file.name, e.target.value)}
                          placeholder="Add a caption..."
                          className="mb-2"
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                className="flex-1"
                isLoading={isUploading}
                disabled={files.length === 0}
              >
                Upload {files.length > 0 && `(${files.length})`}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

