import { prisma } from './prisma'
import { getUnsplashQueryForCategory, getUnsplashImageUrl } from './template-renderer'

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
    {
      name: 'Rustic Wedding',
      description: 'Rustic and charming wedding invitation',
      category: 'wedding',
      preview: null,
      config: {
        textFields: [
          { id: 'bride_name', label: 'Bride Name', placeholder: 'Enter bride name', default: '' },
          { id: 'groom_name', label: 'Groom Name', placeholder: 'Enter groom name', default: '' },
          { id: 'date', label: 'Wedding Date', placeholder: 'Enter wedding date', default: '' },
          { id: 'venue', label: 'Venue', placeholder: 'Enter venue name', default: '' },
          { id: 'message', label: 'Personal Message', placeholder: 'Add a personal message', default: 'We invite you to celebrate our special day' },
        ],
        colors: {
          primary: '#8b4513',
          secondary: '#d2691e',
          accent: '#cd853f',
          background: '#faf5f0',
          text: '#3e2723',
          heading: '#5d4037',
          body: '#6d4c41',
        },
        graphics: [],
      },
      isDefault: false,
      isActive: true,
    },
    {
      name: 'Kids Birthday',
      description: 'Fun and colorful kids birthday invitation',
      category: 'birthday',
      preview: null,
      config: {
        textFields: [
          { id: 'name', label: 'Birthday Child Name', placeholder: 'Enter name', default: '' },
          { id: 'age', label: 'Age', placeholder: 'Enter age', default: '' },
          { id: 'date', label: 'Date', placeholder: 'Enter date', default: '' },
          { id: 'time', label: 'Time', placeholder: 'Enter time', default: '' },
          { id: 'venue', label: 'Venue', placeholder: 'Enter venue', default: '' },
          { id: 'message', label: 'Message', placeholder: 'Add a message', default: 'Join us for a fun-filled celebration!' },
        ],
        colors: {
          primary: '#ff6b6b',
          secondary: '#4ecdc4',
          accent: '#ffe66d',
          background: '#fff9e6',
          text: '#2c3e50',
          heading: '#e74c3c',
          body: '#34495e',
        },
        graphics: [],
      },
      isDefault: false,
      isActive: true,
    },
    {
      name: 'Anniversary',
      description: 'Elegant anniversary celebration invitation',
      category: 'celebration',
      preview: null,
      config: {
        textFields: [
          { id: 'couple_names', label: 'Couple Names', placeholder: 'Enter couple names', default: '' },
          { id: 'years', label: 'Years Together', placeholder: 'e.g., 25th', default: '' },
          { id: 'date', label: 'Date', placeholder: 'Enter date', default: '' },
          { id: 'venue', label: 'Venue', placeholder: 'Enter venue', default: '' },
          { id: 'message', label: 'Message', placeholder: 'Add a message', default: 'Join us in celebrating our love' },
        ],
        colors: {
          primary: '#c9a961',
          secondary: '#d4af37',
          accent: '#f4e4bc',
          background: '#fffef7',
          text: '#2c2416',
          heading: '#8b6914',
          body: '#5a4a2a',
        },
        graphics: [],
      },
      isDefault: false,
      isActive: true,
    },
    {
      name: 'Graduation',
      description: 'Academic graduation celebration invitation',
      category: 'celebration',
      preview: null,
      config: {
        textFields: [
          { id: 'graduate_name', label: 'Graduate Name', placeholder: 'Enter graduate name', default: '' },
          { id: 'degree', label: 'Degree/Program', placeholder: 'e.g., Bachelor of Science', default: '' },
          { id: 'date', label: 'Date', placeholder: 'Enter date', default: '' },
          { id: 'venue', label: 'Venue', placeholder: 'Enter venue', default: '' },
          { id: 'message', label: 'Message', placeholder: 'Add a message', default: 'Join us in celebrating this achievement' },
        ],
        colors: {
          primary: '#1e3a8a',
          secondary: '#3b82f6',
          accent: '#60a5fa',
          background: '#eff6ff',
          text: '#1e293b',
          heading: '#1e40af',
          body: '#475569',
        },
        graphics: [],
      },
      isDefault: false,
      isActive: true,
    },
  ]

  for (const template of templates) {
    // Check if template already exists
    const existing = await prisma.invitationTemplate.findFirst({
      where: { name: template.name },
    })

    if (!existing) {
      // Generate preview image URL using Unsplash
      const query = getUnsplashQueryForCategory(template.category)
      const previewUrl = getUnsplashImageUrl(query, 400, 500)

      await prisma.invitationTemplate.create({
        data: {
          ...template,
          preview: previewUrl, // Add Unsplash preview image
        },
      })
    } else if (!existing.preview) {
      // Update existing template without preview
      const query = getUnsplashQueryForCategory(template.category)
      const previewUrl = getUnsplashImageUrl(query, 400, 500)
      
      await prisma.invitationTemplate.update({
        where: { id: existing.id },
        data: { preview: previewUrl },
      })
    }
  }

  console.log(`Seeded ${templates.length} invitation templates`)
}

