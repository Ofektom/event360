'use client'

import { useState } from 'react'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/atoms/Card'

interface PhoneContact {
  name: string
  phone: string[]
  email?: string[]
}

interface PhoneContactsPickerProps {
  onContactsSelected: (contacts: PhoneContact[]) => void
  onClose?: () => void
}

export function PhoneContactsPicker({
  onContactsSelected,
  onClose,
}: PhoneContactsPickerProps) {
  const [contacts, setContacts] = useState<PhoneContact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectContacts = async () => {
    try {
      // Check if Contacts API is supported
      if (!('contacts' in navigator && 'ContactsManager' in window)) {
        setError('Contacts API is not supported in this browser. Please use Chrome/Edge on Android or Safari on iOS.')
        return
      }

      setLoading(true)
      setError(null)
      
      // Request contacts with phone numbers
      const contactsManager = new (window as any).ContactsManager()
      const contacts = await contactsManager.select(['name', 'tel', 'email'], {
        multiple: true,
      })

      const formattedContacts: PhoneContact[] = contacts.map((contact: any) => ({
        name: contact.name?.[0] || 'Unknown',
        phone: contact.tel || [],
        email: contact.email || [],
      }))

      setContacts(formattedContacts)
      setSelectedContacts(new Set(formattedContacts.map((_, i) => i)))
    } catch (error: any) {
      console.error('Error accessing contacts:', error)
      setError(error.message || 'Failed to access contacts. Please ensure you granted permission.')
    } finally {
      setLoading(false)
    }
  }

  const toggleContact = (index: number) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedContacts(newSelected)
  }

  const handleConfirm = () => {
    const selected = contacts.filter((_, i) => selectedContacts.has(i))
    onContactsSelected(selected)
    setContacts([])
    setSelectedContacts(new Set())
    if (onClose) {
      onClose()
    }
  }

  const handleSelectAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(contacts.map((_, i) => i)))
    }
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Phone Contacts</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            ×
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Import contacts from your phone to quickly add guests
          </p>
          <Button
            variant="primary"
            onClick={handleSelectContacts}
            isLoading={loading}
          >
            📱 Select from Phone
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Works on Chrome/Edge (Android) and Safari (iOS)
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-600">
              {selectedContacts.size} of {contacts.length} selected
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedContacts.size === contacts.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
            {contacts.map((contact, index) => (
              <div
                key={index}
                onClick={() => toggleContact(index)}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedContacts.has(index)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{contact.name}</div>
                {contact.phone[0] && (
                  <div className="text-sm text-gray-600 mt-1">📞 {contact.phone[0]}</div>
                )}
                {contact.email?.[0] && (
                  <div className="text-sm text-gray-600">📧 {contact.email[0]}</div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleConfirm} className="flex-1">
              Add {selectedContacts.size} Contact(s)
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  )
}

