'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'

interface QRCodeUploadProps {
  eventId: string
  onUpload?: (files: File[]) => void
}

export function QRCodeUpload({ eventId, onUpload }: QRCodeUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const imageFiles = Array.from(selectedFiles).filter((file) =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    )

    setFiles((prev) => [...prev, ...imageFiles])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleUpload = () => {
    if (files.length > 0) {
      onUpload?.(files)
      setFiles([])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <Card
        variant={isDragging ? 'outlined' : 'default'}
        padding="lg"
        className={`border-dashed transition-colors ${
          isDragging ? 'border-[var(--theme-primary)] bg-[var(--theme-accent)]' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">📸</div>
          <h3 className="text-lg font-semibold mb-2">Upload Photos & Videos</h3>
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or click to select
          </p>
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
          >
            Choose Files
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Supports JPEG, PNG, MP4, MOV (max 50MB per file)
          </p>
        </div>
      </Card>

      {files.length > 0 && (
        <Card variant="elevated" padding="md">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </h4>
              <Button variant="primary" onClick={handleUpload}>
                Upload
              </Button>
            </div>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {file.type.startsWith('image/') ? '🖼️' : '🎥'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

