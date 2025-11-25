'use client'

import { useState } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface CustomInvitationUploadProps {
  eventId: string
  onUploadSuccess: (designId: string) => void
  onCancel: () => void
}

export function CustomInvitationUpload({
  eventId,
  onUploadSuccess,
  onCancel,
}: CustomInvitationUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [designName, setDesignName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
  const maxSize = 10 * 1024 * 1024 // 10MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError(null)

    // Validate file type
    if (!acceptedFormats.includes(selectedFile.type)) {
      setError('Please upload a PNG, JPG, or PDF file')
      setFile(null)
      setPreview(null)
      return
    }

    // Validate file size
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 10MB')
      setFile(null)
      setPreview(null)
      return
    }

    setFile(selectedFile)

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.onerror = () => {
        setError('Failed to load image preview')
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedFile = e.dataTransfer.files[0]
    if (!droppedFile) return

    // Create a synthetic event to reuse validation logic
    const syntheticEvent = {
      target: {
        files: [droppedFile],
      },
    } as React.ChangeEvent<HTMLInputElement>

    handleFileChange(syntheticEvent)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Step 1: Upload file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('eventId', eventId)
      formData.append('type', 'invitation')

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload file')
      }

      const uploadData = await uploadResponse.json()
      const fileUrl = uploadData.url

      if (!fileUrl) {
        throw new Error('No file URL returned from upload')
      }

      // Step 2: Create invitation design
      const designResponse = await fetch('/api/invitations/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          templateId: null, // Custom upload, no template
          name: designName || file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          customImage: fileUrl,
          designData: {
            type: file.type.startsWith('image/') ? 'image' : 'pdf',
            originalFilename: file.name,
            fileSize: file.size,
            mimeType: file.type,
          },
        }),
      })

      if (!designResponse.ok) {
        const errorData = await designResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create design')
      }

      const design = await designResponse.json()
      onUploadSuccess(design.id)
    } catch (error: any) {
      console.error('Error uploading:', error)
      setError(error.message || 'Failed to upload invitation. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Upload Custom Invitation
      </h2>
      <p className="text-gray-600 mb-6">
        Upload your own invitation design (PNG, JPG, or PDF). Maximum file size: 10MB
      </p>

      <div className="space-y-6">
        {/* Design Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Design Name (optional)
          </label>
          <Input
            type="text"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            placeholder={file ? file.name.replace(/\.[^/.]+$/, '') : 'My Custom Invitation'}
            disabled={uploading}
          />
          <p className="mt-1 text-xs text-gray-500">
            If left empty, the filename will be used
          </p>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload File
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            
            {uploading ? (
              <div className="flex flex-col items-center">
                <LoadingSpinner />
                <p className="mt-4 text-sm text-gray-600">Uploading...</p>
              </div>
            ) : preview ? (
              <div className="mb-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full max-h-64 mx-auto rounded-lg border border-gray-300 shadow-sm"
                />
                <p className="mt-2 text-sm text-gray-600">{file?.name}</p>
                <p className="text-xs text-gray-500">
                  {(file?.size ? file.size / 1024 / 1024 : 0).toFixed(2)} MB
                </p>
              </div>
            ) : file ? (
              <div className="mb-4">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm text-gray-600 font-medium">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-2">📤</div>
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, or PDF (max 10MB)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!file || uploading}
            isLoading={uploading}
            className="flex-1"
          >
            {uploading ? 'Uploading...' : 'Upload & Save'}
          </Button>
          <Button 
            variant="outline" 
            onClick={onCancel} 
            className="flex-1"
            disabled={uploading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  )
}

