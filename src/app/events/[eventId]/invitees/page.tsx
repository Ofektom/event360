'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { RSVPStatus } from '@/types/enums'

interface Invitee {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  group: string | null
  rsvpStatus: RSVPStatus
  rsvpNotes: string | null
  preferredChannel: string | null
  createdAt: string
}

interface Event {
  id: string
  title: string
}

export default function InviteesPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [invitees, setInvitees] = useState<Invitee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [rsvpFilter, setRsvpFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    group: '',
    preferredChannel: 'email',
  })

  // Bulk import state
  const [bulkData, setBulkData] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/events/${eventId}/invitees`)
      return
    }
    if (status === 'authenticated') {
      fetchEvent()
      fetchInvitees()
    }
  }, [eventId, status, router, rsvpFilter])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch event')
      }
      const data = await response.json()
      setEvent(data)
    } catch (error) {
      console.error('Error fetching event:', error)
      setError('Failed to load event')
    }
  }

  const fetchInvitees = async () => {
    try {
      setLoading(true)
      const url = rsvpFilter === 'all'
        ? `/api/events/${eventId}/invitees`
        : `/api/events/${eventId}/invitees?rsvpStatus=${rsvpFilter}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch invitees')
      }
      const data = await response.json()
      setInvitees(data)
    } catch (error) {
      console.error('Error fetching invitees:', error)
      setError('Failed to load invitees')
    } finally {
      setLoading(false)
    }
  }

  const handleAddInvitee = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/events/${eventId}/invitees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          role: formData.role || undefined,
          group: formData.group || undefined,
          preferredChannel: formData.preferredChannel || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add invitee')
      }

      // Reset form and refresh list
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        group: '',
        preferredChannel: 'email',
      })
      setShowAddForm(false)
      fetchInvitees()
    } catch (error: any) {
      setError(error.message || 'Failed to add invitee')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkImport = async () => {
    if (!bulkData.trim()) {
      setError('Please enter invitee data')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Parse CSV-like data (name,email,phone format)
      const lines = bulkData.trim().split('\n')
      const invitees = lines.map(line => {
        const parts = line.split(',').map(p => p.trim())
        return {
          name: parts[0] || '',
          email: parts[1] || undefined,
          phone: parts[2] || undefined,
          role: parts[3] || undefined,
          group: parts[4] || undefined,
        }
      }).filter(inv => inv.name) // Filter out empty names

      if (invitees.length === 0) {
        throw new Error('No valid invitees found')
      }

      const response = await fetch(`/api/events/${eventId}/invitees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitees }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import invitees')
      }

      setBulkData('')
      setShowBulkForm(false)
      fetchInvitees()
    } catch (error: any) {
      setError(error.message || 'Failed to import invitees')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteInvitee = async (inviteeId: string) => {
    if (!confirm('Are you sure you want to delete this invitee?')) {
      return
    }

    try {
      const response = await fetch(`/api/invitees/${inviteeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete invitee')
      }

      fetchInvitees()
    } catch (error) {
      console.error('Error deleting invitee:', error)
      setError('Failed to delete invitee')
    }
  }

  const getRsvpStatusColor = (status: RSVPStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'DECLINED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'MAYBE':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredInvitees = invitees.filter(invitee => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      invitee.name.toLowerCase().includes(query) ||
      invitee.email?.toLowerCase().includes(query) ||
      invitee.phone?.includes(query) ||
      invitee.group?.toLowerCase().includes(query)
    )
  })

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect
  }

  if (!event) {
    return (
      <DashboardLayout>
        <ErrorMessage message="Event not found" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Link href={`/events/${eventId}`}>
              <Button variant="ghost" size="sm" className="mb-4">
                ← Back to Event
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Guest Management</h1>
            <p className="text-gray-600 mt-2">
              Manage invitees for {event.title}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search invitees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={rsvpFilter}
              onChange={(e) => setRsvpFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All RSVP Status</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="DECLINED">Declined</option>
              <option value="MAYBE">Maybe</option>
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkForm(!showBulkForm)
                setShowAddForm(false)
              }}
            >
              {showBulkForm ? 'Cancel Bulk' : 'Bulk Import'}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowAddForm(!showAddForm)
                setShowBulkForm(false)
              }}
            >
              {showAddForm ? 'Cancel' : '+ Add Guest'}
            </Button>
          </div>
        </div>

        {/* Add Invitee Form */}
        {showAddForm && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Guest</h2>
            <form onSubmit={handleAddInvitee} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <Input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Bridesmaid, Groomsman, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group
                  </label>
                  <Input
                    type="text"
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    placeholder="Family, Friends, Colleagues"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Channel
                  </label>
                  <select
                    value={formData.preferredChannel}
                    onChange={(e) => setFormData({ ...formData, preferredChannel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="in-app">In-App</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" variant="primary" isLoading={saving} disabled={saving}>
                  Add Guest
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Bulk Import Form */}
        {showBulkForm && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Import Guests</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter guest information in CSV format (one per line):<br />
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">Name,Email,Phone,Role,Group</code>
            </p>
            <textarea
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              placeholder="John Doe,john@example.com,+1234567890,Groomsman,Family&#10;Jane Smith,jane@example.com,+0987654321,Bridesmaid,Friends"
            />
            <div className="flex gap-3 mt-4">
              <Button variant="primary" onClick={handleBulkImport} isLoading={saving} disabled={saving}>
                Import Guests
              </Button>
              <Button variant="outline" onClick={() => setShowBulkForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Invitees List */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Guests ({filteredInvitees.length})
            </h2>
          </div>

          {filteredInvitees.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">👥</div>
              <p>No invitees found.</p>
              <p className="text-sm mt-2 mb-4">
                {searchQuery || rsvpFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first guest to get started'}
              </p>
              {!searchQuery && rsvpFilter === 'all' && (
                <Button variant="primary" onClick={() => setShowAddForm(true)}>
                  Add First Guest
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Group</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">RSVP Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvitees.map((invitee) => (
                    <tr key={invitee.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{invitee.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {invitee.email && <div>{invitee.email}</div>}
                          {invitee.phone && <div>{invitee.phone}</div>}
                          {!invitee.email && !invitee.phone && (
                            <span className="text-gray-400">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{invitee.role || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{invitee.group || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getRsvpStatusColor(
                            invitee.rsvpStatus
                          )}`}
                        >
                          {invitee.rsvpStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/events/${eventId}/invitees/${invitee.id}`}>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInvitee(invitee.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

