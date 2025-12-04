'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { PhoneContactsPicker } from '@/components/organisms/PhoneContactsPicker'

interface InvitationDesign {
  id: string
  name: string | null
  imageUrl: string | null
  customImage: string | null
  isDefault: boolean
}

interface Event {
  id: string
  title: string
  slug: string | null
}

interface Contact {
  id: string
  name: string
  contactInfo: string
  channel: string
}

const CHANNELS = [
  { value: 'WHATSAPP', label: 'WhatsApp', icon: '💬', placeholder: '+1234567890', validation: /^\+?[1-9]\d{1,14}$/ },
  { value: 'FACEBOOK_MESSENGER', label: 'Messenger', icon: '💌', placeholder: 'username or Facebook ID', validation: /^[a-zA-Z0-9._]+$/ },
  { value: 'INSTAGRAM_DM', label: 'Instagram DM', icon: '📷', placeholder: '@username or username', validation: /^@?[a-zA-Z0-9._]+$/ },
  { value: 'EMAIL', label: 'Email', icon: '📧', placeholder: 'email@example.com', validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
]

export default function SendInvitationsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [designs, setDesigns] = useState<InvitationDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Step 1: Design selection
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null)

  // Step 2: Channel selection
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)

  // Step 3: Contacts
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactName, setContactName] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  
  // Contact import states
  const [showPhoneContacts, setShowPhoneContacts] = useState(false)
  const [showSocialContacts, setShowSocialContacts] = useState(false)
  const [socialContacts, setSocialContacts] = useState<any[]>([])
  const [loadingSocialContacts, setLoadingSocialContacts] = useState(false)
  const [hasFacebookAccount, setHasFacebookAccount] = useState(false)
  const [linkingFacebook, setLinkingFacebook] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/events/${eventId}/send-invitations`)
      return
    }
    if (status === 'authenticated') {
      fetchData()
    }
  }, [eventId, status, router])

  // Check for Facebook linking completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const linked = urlParams.get('facebook_linked')
    if (linked === 'true') {
      setHasFacebookAccount(true)
      setSuccess('Facebook account linked successfully! You can now import friends.')
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [eventRes, designsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/invitations/designs?eventId=${eventId}`),
      ])

      if (!eventRes.ok || !designsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [eventData, designsData] = await Promise.all([
        eventRes.json(),
        designsRes.json(),
      ])

      setEvent(eventData)
      setDesigns(designsData)

      // Check for designId in URL query params first
      const designIdFromUrl = searchParams.get('designId')
      if (designIdFromUrl && designsData.find((d: InvitationDesign) => d.id === designIdFromUrl)) {
        setSelectedDesign(designIdFromUrl)
      } else {
        // Set default design if available
        const defaultDesign = designsData.find((d: InvitationDesign) => d.isDefault)
        if (defaultDesign) {
          setSelectedDesign(defaultDesign.id)
        } else if (designsData.length > 0) {
          setSelectedDesign(designsData[0].id)
        }
      }

      // Check if user has Facebook account linked
      checkFacebookAccount()
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const checkFacebookAccount = async () => {
    try {
      const response = await fetch('/api/social/facebook/check')
      if (response.ok) {
        const data = await response.json()
        setHasFacebookAccount(data.linked || false)
      }
    } catch (error) {
      console.error('Error checking Facebook account:', error)
    }
  }

  const handleLinkFacebook = async () => {
    try {
      setLinkingFacebook(true)
      setError(null)
      
      const response = await fetch(`/api/social/facebook/link?eventId=${eventId}`)
      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.linked) {
          setHasFacebookAccount(true)
          setError(null)
          setLinkingFacebook(false)
          return
        }
        throw new Error(errorData.error || 'Failed to link Facebook account')
      }

      const data = await response.json()
      
      // Redirect to Facebook OAuth
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        throw new Error('No authentication URL received')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to link Facebook account')
      setLinkingFacebook(false)
    }
  }

  const validateContact = (info: string, channel: string): boolean => {
    const channelConfig = CHANNELS.find((c) => c.value === channel)
    if (!channelConfig) return false

    // Remove @ for Instagram validation
    const cleanedInfo = channel === 'INSTAGRAM_DM' ? info.replace('@', '') : info

    return channelConfig.validation.test(cleanedInfo)
  }

  const handleAddContact = () => {
    if (!selectedChannel) {
      setError('Please select a channel first')
      return
    }

    if (!contactName.trim()) {
      setError('Please enter a name')
      return
    }

    if (!contactInfo.trim()) {
      setError('Please enter contact information')
      return
    }

    // Validate contact info based on channel
    if (!validateContact(contactInfo, selectedChannel)) {
      const channelConfig = CHANNELS.find((c) => c.value === selectedChannel)
      setError(`Invalid ${channelConfig?.label} format. Example: ${channelConfig?.placeholder}`)
      return
    }

    // Check for duplicates
    const isDuplicate = contacts.some(
      (c) => c.contactInfo === contactInfo && c.channel === selectedChannel
    )
    if (isDuplicate) {
      setError('This contact has already been added')
      return
    }

    // Add contact
    const newContact: Contact = {
      id: `contact_${Date.now()}`,
      name: contactName.trim(),
      contactInfo: contactInfo.trim(),
      channel: selectedChannel,
    }

    setContacts([...contacts, newContact])
    setContactName('')
    setContactInfo('')
    setError(null)
  }

  const handleRemoveContact = (contactId: string) => {
    setContacts(contacts.filter((c) => c.id !== contactId))
  }

  const fetchFacebookFriends = async () => {
    // Check if Facebook account is linked first
    if (!hasFacebookAccount) {
      // Show a modal or prompt to connect Facebook
      setError('To import friends from Facebook, you need to connect your Facebook account. Click "Connect Facebook" below to get started.')
      return
    }

    try {
      setLoadingSocialContacts(true)
      setError(null)
      const response = await fetch('/api/social/facebook/friends')
      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 400 && errorData.error?.includes('not linked')) {
          setHasFacebookAccount(false)
          setError('Facebook account not linked. Please connect your Facebook account first by clicking "Connect Facebook" below.')
        } else {
          throw new Error(errorData.error || 'Failed to fetch friends')
        }
        return
      }
      const data = await response.json()
      setSocialContacts(data.friends || [])
      setShowSocialContacts(true)
      if (data.message) {
        // Show info message if no friends found
        setSuccess(data.message || 'Friends loaded successfully')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch Facebook friends')
    } finally {
      setLoadingSocialContacts(false)
    }
  }

  const handlePhoneContactsSelected = (phoneContacts: Array<{ name: string; phone: string[]; email?: string[] }>) => {
    const newContacts: Contact[] = []
    
    phoneContacts.forEach((contact) => {
      // Add phone numbers (for WhatsApp/SMS)
      if (selectedChannel === 'WHATSAPP') {
        contact.phone.forEach((phone) => {
          if (validateContact(phone, 'WHATSAPP')) {
            newContacts.push({
              id: `phone_${Date.now()}_${Math.random()}_${phone}`,
              name: contact.name,
              contactInfo: phone,
              channel: 'WHATSAPP',
            })
          }
        })
      }
      
      // Add emails (for Email channel)
      if (selectedChannel === 'EMAIL' && contact.email) {
        contact.email.forEach((email) => {
          if (validateContact(email, 'EMAIL')) {
            newContacts.push({
              id: `email_${Date.now()}_${Math.random()}_${email}`,
              name: contact.name,
              contactInfo: email,
              channel: 'EMAIL',
            })
          }
        })
      }
    })
    
    if (newContacts.length > 0) {
      setContacts([...contacts, ...newContacts])
      setShowPhoneContacts(false)
    } else {
      setError(`No valid ${selectedChannelConfig?.label} contacts found in selected phone contacts`)
    }
  }

  const handleSocialContactSelected = (friend: any) => {
    const newContacts: Contact[] = []
    
    // Auto-detect available channels based on selected channel
    if (selectedChannel === 'FACEBOOK_MESSENGER' && friend.messengerId) {
      newContacts.push({
        id: `fb_${friend.id}`,
        name: friend.name,
        contactInfo: friend.messengerId,
        channel: 'FACEBOOK_MESSENGER',
      })
    }
    
    if (selectedChannel === 'EMAIL' && friend.email) {
      newContacts.push({
        id: `fb_email_${friend.id}`,
        name: friend.name,
        contactInfo: friend.email,
        channel: 'EMAIL',
      })
    }
    
    if (newContacts.length > 0) {
      setContacts([...contacts, ...newContacts])
    } else {
      setError(`Selected friend doesn't have ${selectedChannelConfig?.label} contact info available`)
    }
  }

  const handleSendInvitations = async () => {
    if (!selectedDesign) {
      setError('Please select an invitation design')
      return
    }

    if (!selectedChannel) {
      setError('Please select a delivery channel')
      return
    }

    if (contacts.length === 0) {
      setError('Please add at least one contact')
      return
    }

    setSending(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/invites/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          designId: selectedDesign,
          channel: selectedChannel,
          contacts: contacts.map((c) => ({
            name: c.name,
            contactInfo: c.contactInfo,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send invitations')
      }

      const result = await response.json()
      setSuccess(
        `Successfully sent ${result.sent} invitation(s). ${result.failed > 0 ? `${result.failed} failed.` : ''}`
      )

      // Clear contacts after successful send
      setTimeout(() => {
        setContacts([])
        setContactName('')
        setContactInfo('')
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'Failed to send invitations')
    } finally {
      setSending(false)
    }
  }

  const selectedChannelConfig = CHANNELS.find((c) => c.value === selectedChannel)

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
    return null
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
        <div>
          <Link href={`/events/${eventId}/invitees`}>
            <Button variant="ghost" size="sm" className="mb-4">
              ← Back to Guests
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Send Invitations</h1>
          <p className="text-gray-600 mt-2">
            Send invitation designs to guests for {event.title}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Step 1: Design Selection */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Step 1: Select Invitation Design
          </h2>
          {designs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No invitation designs found.</p>
              <Link href={`/events/${eventId}/invitations`}>
                <Button variant="primary" className="mt-4">
                  Create Design
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {designs.map((design) => (
                <div
                  key={design.id}
                  onClick={() => setSelectedDesign(design.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedDesign === design.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {design.imageUrl || design.customImage ? (
                    <img
                      src={design.imageUrl || design.customImage || ''}
                      alt={design.name || 'Invitation'}
                      className="w-full h-32 object-contain rounded mb-2 bg-white"
                      loading="lazy"
                      onError={(e) => {
                        console.error('❌ Failed to load design image in send page:', {
                          imageUrl: design.imageUrl,
                          customImage: design.customImage,
                          designId: design.id
                        })
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center"><span class="text-gray-400">No Preview</span></div>'
                        }
                      }}
                      onLoad={() => {
                        console.log('✅ Image loaded in send page:', design.imageUrl || design.customImage)
                      }}
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center">
                      <span className="text-gray-400">No Preview</span>
                    </div>
                  )}
                  <p className="font-medium text-gray-900">
                    {design.name || 'Untitled Design'}
                  </p>
                  {design.isDefault && (
                    <span className="text-xs text-purple-600">Default</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Step 2: Channel Selection */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Step 2: Select Delivery Channel
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CHANNELS.map((channel) => (
              <button
                key={channel.value}
                onClick={() => {
                  setSelectedChannel(channel.value)
                  setContacts([]) // Clear contacts when changing channel
                  setContactName('')
                  setContactInfo('')
                  setError(null)
                  setShowPhoneContacts(false)
                  setShowSocialContacts(false)
                  setSocialContacts([])
                }}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  selectedChannel === channel.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{channel.icon}</div>
                <div className="text-sm font-medium text-gray-700">{channel.label}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Step 3: Add Contacts */}
        {selectedChannel && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Step 3: Add Contacts ({contacts.length} added)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Add contacts to send invitations via {selectedChannelConfig?.label}. 
              Each contact will be validated before sending.
            </p>

            {/* Import Options */}
            <div className="space-y-3 mb-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPhoneContacts(!showPhoneContacts)
                    setShowSocialContacts(false)
                  }}
                >
                  📱 Import from Phone
                </Button>
                {hasFacebookAccount ? (
                  <Button
                    variant="outline"
                    onClick={fetchFacebookFriends}
                    isLoading={loadingSocialContacts}
                  >
                    👥 Import Facebook Friends
                  </Button>
                ) : (
                  <div className="w-full">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">ℹ️</div>
                        <div className="flex-1">
                          <p className="font-medium text-blue-900 mb-2">Connect Facebook to Import Friends</p>
                          <p className="text-sm text-blue-800 mb-3">
                            To import your Facebook friends, you need to connect your Facebook account. This is required by Facebook's security policies.
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 mb-3">
                            <li>Access your friends list (only friends who also use this app)</li>
                            <li>Send invitations via Facebook Messenger</li>
                            <li>Quickly add your social contacts</li>
                          </ul>
                          <p className="text-xs text-blue-700 font-medium">
                            🔒 Your privacy is protected: We only access friends who have connected with this app, and you can revoke access anytime from your Facebook settings.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleLinkFacebook}
                      isLoading={linkingFacebook}
                      className="w-full sm:w-auto"
                    >
                      {linkingFacebook ? 'Connecting...' : '🔗 Connect Facebook Account'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Phone Contacts Picker */}
            {showPhoneContacts && (
              <div className="mb-4">
                <PhoneContactsPicker
                  onContactsSelected={handlePhoneContactsSelected}
                  onClose={() => setShowPhoneContacts(false)}
                />
              </div>
            )}

            {/* Social Contacts Picker */}
            {showSocialContacts && (
              <Card className="p-4 mb-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Facebook Friends {socialContacts.length > 0 && `(${socialContacts.length})`}
                  </h3>
                  <button
                    onClick={() => {
                      setShowSocialContacts(false)
                      setSocialContacts([])
                    }}
                    className="text-gray-500 hover:text-gray-700"
                    type="button"
                  >
                    ×
                  </button>
                </div>
                {socialContacts.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {socialContacts.map((friend) => {
                      const hasContactInfo = 
                        (selectedChannel === 'FACEBOOK_MESSENGER' && friend.messengerId) ||
                        (selectedChannel === 'EMAIL' && friend.email)
                      
                      return (
                        <div
                          key={friend.id}
                          onClick={() => hasContactInfo && handleSocialContactSelected(friend)}
                          className={`p-3 border rounded-lg transition-all ${
                            hasContactInfo
                              ? 'cursor-pointer hover:border-purple-500 border-gray-200'
                              : 'opacity-50 cursor-not-allowed border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {friend.picture && (
                              <img
                                src={friend.picture}
                                alt={friend.name}
                                className="w-10 h-10 rounded-full"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{friend.name}</div>
                              {friend.email && (
                                <div className="text-sm text-gray-600">📧 {friend.email}</div>
                              )}
                              {!hasContactInfo && (
                                <div className="text-xs text-red-500 mt-1">
                                  No {selectedChannelConfig?.label} contact available
                                </div>
                              )}
                            </div>
                            {hasContactInfo && (
                              <div className="text-purple-600 text-sm">+ Add</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-600 mb-2">
                      No friends found.
                    </p>
                    <p className="text-xs text-gray-500">
                      Make sure you've signed in with Facebook and that your friends have also connected with this app.
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* Add Contact Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Input
                type="text"
                placeholder="Guest Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddContact()
                  }
                }}
              />
              <Input
                type="text"
                placeholder={selectedChannelConfig?.placeholder || 'Contact info'}
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddContact()
                  }
                }}
              />
              <Button
                variant="primary"
                onClick={handleAddContact}
                disabled={!contactName.trim() || !contactInfo.trim()}
              >
                Add Contact
              </Button>
            </div>

            {/* Contacts List */}
            {contacts.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-600">{contact.contactInfo}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveContact(contact.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Step 4: Send */}
        {selectedDesign && selectedChannel && contacts.length > 0 && (
          <Card className="p-6 bg-purple-50 border-purple-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Ready to Send
                </h2>
                <p className="text-sm text-gray-600">
                  {contacts.length} invitation(s) will be sent via {selectedChannelConfig?.label}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleSendInvitations}
                isLoading={sending}
                disabled={sending}
                size="lg"
              >
                Send {contacts.length} Invitation(s)
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
