'use client'

import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { BackButton } from '@/components/shared/BackButton'

export default function GallerySettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton href="/gallery" />
        <h1 className="text-3xl font-bold text-gray-900">Gallery Settings</h1>
        
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Photo Quality
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="high">High Quality</option>
                <option value="medium">Medium Quality</option>
                <option value="low">Low Quality (Faster Loading)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-approve Photo Uploads
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Automatically approve photos uploaded by guests
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allow Guest Uploads
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Allow guests to upload photos to events
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="primary">
                Save Settings
              </Button>
              <Button variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

