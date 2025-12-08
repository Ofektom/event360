'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { QRCodeSVG } from 'qrcode.react'

interface ShareEventModalProps {
  eventId: string
  shareLink: string | null
  qrCode: string | null
  slug?: string | null
  onClose: () => void
}

export function ShareEventModal({ eventId, shareLink, qrCode, slug, onClose }: ShareEventModalProps) {
  const [copied, setCopied] = useState(false)

  // Generate the correct share link using current base URL
  // This fixes the issue where old events have localhost:3000 in the database
  const currentShareLink = useMemo(() => {
    if (slug) {
      // Use the current origin (production or localhost) with the slug
      return `${window.location.origin}/e/${slug}`
    } else if (shareLink) {
      // If we have a shareLink but no slug, try to extract the path and use current origin
      try {
        const url = new URL(shareLink)
        return `${window.location.origin}${url.pathname}`
      } catch {
        // If shareLink is not a valid URL, construct from eventId
        return `${window.location.origin}/events/${eventId}`
      }
    } else {
      // Fallback: construct from eventId
      return `${window.location.origin}/events/${eventId}`
    }
  }, [shareLink, slug, eventId])

  const handleCopyLink = async () => {
    if (currentShareLink) {
      try {
        await navigator.clipboard.writeText(currentShareLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy link:', error)
      }
    }
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
              value={currentShareLink || 'Generating...'}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
            />
            <Button
              variant="primary"
              onClick={handleCopyLink}
              size="sm"
              disabled={!currentShareLink}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Share this link with your guests to access the event
          </p>
        </div>

        {/* QR Code */}
        {currentShareLink && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code
            </label>
            <div className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg">
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center p-4">
                <QRCodeSVG
                  value={currentShareLink}
                  size={192}
                  level="H"
                  includeMargin={true}
                />
              </div>
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

