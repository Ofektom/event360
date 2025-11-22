'use client'

import { useState } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'

interface ShareEventModalProps {
  eventId: string
  shareLink: string | null
  qrCode: string | null
  onClose: () => void
}

export function ShareEventModal({ eventId, shareLink, qrCode, onClose }: ShareEventModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    if (shareLink) {
      try {
        await navigator.clipboard.writeText(shareLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy link:', error)
      }
    }
  }

  const handleDownloadQR = () => {
    // TODO: Implement QR code image generation and download
    // For now, we'll just show the QR code string
    alert(`QR Code: ${qrCode}\n\nQR code image download will be implemented soon.`)
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className="p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Share Event</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Share Link */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareLink || 'Generating...'}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
            />
            <Button
              variant="primary"
              onClick={handleCopyLink}
              size="sm"
              disabled={!shareLink}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Share this link with your guests to access the event
          </p>
        </div>

        {/* QR Code */}
        {qrCode && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code
            </label>
            <div className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-xs text-gray-500">QR Code</p>
                  <p className="text-xs text-gray-400 mt-1">{qrCode.substring(0, 20)}...</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadQR}
              >
                Download QR Code
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Scan this QR code to access the event
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </Card>
    </div>
  )
}

