import { prisma } from './prisma'

/**
 * Seed initial invitation templates
 * Run this after migration to populate default templates
 */
export async function seedInvitationTemplates() {
  const templates = [
    {
      name: 'Elegant Wedding',
      description: 'Classic and elegant wedding invitation template',
      category: 'wedding',
      preview: null,
      config: {
        textFields: [
          {
            id: 'bride_name',
            label: 'Bride Name',
            placeholder: 'Enter bride name',
            default: '',
          },
          {
            id: 'groom_name',
            label: 'Groom Name',
            placeholder: 'Enter groom name',
            default: '',
          },
          {
            id: 'date',
            label: 'Wedding Date',
            placeholder: 'Enter wedding date',
            default: '',
          },
          {
            id: 'venue',
            label: 'Venue',
            placeholder: 'Enter venue name',
            default: '',
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
        graphics: [],
      },
      isDefault: true,
      isActive: true,
    },
    {
      name: 'Modern Birthday',
      description: 'Fun and modern birthday celebration template',
      category: 'birthday',
      preview: null,
      config: {
        textFields: [
          {
            id: 'name',
            label: 'Birthday Person Name',
            placeholder: 'Enter name',
            default: '',
          },
          {
            id: 'age',
            label: 'Age',
            placeholder: 'Enter age',
            default: '',
          },
          {
            id: 'date',
            label: 'Date',
            placeholder: 'Enter date',
            default: '',
          },
          {
            id: 'venue',
            label: 'Venue',
            placeholder: 'Enter venue',
            default: '',
          },
          {
            id: 'message',
            label: 'Message',
            placeholder: 'Add a message',
            default: 'Join us for a celebration!',
          },
        ],
        colors: {
          primary: '#f59e0b',
          secondary: '#ef4444',
          accent: '#ef4444',
          background: '#fef3c7',
          text: '#1f2937',
          heading: '#1f2937',
          body: '#4b5563',
        },
        graphics: [],
      },
      isDefault: true,
      isActive: true,
    },
    {
      name: 'Corporate Event',
      description: 'Professional corporate event invitation',
      category: 'corporate',
      preview: null,
      config: {
        textFields: [
          {
            id: 'event_name',
            label: 'Event Name',
            placeholder: 'Enter event name',
            default: '',
          },
          {
            id: 'date',
            label: 'Date',
            placeholder: 'Enter date',
            default: '',
          },
          {
            id: 'time',
            label: 'Time',
            placeholder: 'Enter time',
            default: '',
          },
          {
            id: 'venue',
            label: 'Venue',
            placeholder: 'Enter venue',
            default: '',
          },
          {
            id: 'rsvp',
            label: 'RSVP Information',
            placeholder: 'Enter RSVP details',
            default: 'Please RSVP by [date]',
          },
        ],
        colors: {
          primary: '#1e40af',
          secondary: '#3b82f6',
          accent: '#3b82f6',
          background: '#ffffff',
          text: '#1f2937',
          heading: '#1e40af',
          body: '#4b5563',
        },
        graphics: [],
      },
      isDefault: true,
      isActive: true,
    },
    {
      name: 'Celebration',
      description: 'General celebration invitation template',
      category: 'celebration',
      preview: null,
      config: {
        textFields: [
          {
            id: 'title',
            label: 'Event Title',
            placeholder: 'Enter event title',
            default: '',
          },
          {
            id: 'date',
            label: 'Date',
            placeholder: 'Enter date',
            default: '',
          },
          {
            id: 'venue',
            label: 'Venue',
            placeholder: 'Enter venue',
            default: '',
          },
          {
            id: 'message',
            label: 'Message',
            placeholder: 'Add a message',
            default: 'You are invited to join us!',
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
        graphics: [],
      },
      isDefault: true,
      isActive: true,
    },
  ]

  for (const template of templates) {
    // Check if template already exists
    const existing = await prisma.invitationTemplate.findFirst({
      where: { name: template.name },
    })

    if (!existing) {
      await prisma.invitationTemplate.create({
        data: template,
      })
    }
  }

  console.log(`Seeded ${templates.length} invitation templates`)
}

