import { EventRepository } from '@/repositories/event.repository'
import { CreateEventDto, UpdateEventDto, GetEventsFilters } from '@/types/event.types'
import { EventStatus } from '@/types/enums'

type Event = Awaited<ReturnType<EventRepository['findById']>>

export class EventService {
  private eventRepository: EventRepository

  constructor() {
    this.eventRepository = new EventRepository()
  }

  async getEvents(filters: GetEventsFilters) {
    if (!filters.ownerId) {
      throw new Error('User ID is required')
    }
    return this.eventRepository.findAll(filters)
  }

  async getEventById(id: string) {
    const event = await this.eventRepository.findById(id)
    if (!event) {
      throw new Error('Event not found')
    }
    return event
  }

  async getEventBySlug(slug: string) {
    const event = await this.eventRepository.findBySlug(slug)
    if (!event) {
      throw new Error('Event not found')
    }
    return event
  }

  async createEvent(data: CreateEventDto) {
    // Business logic validation
    if (!data.title || !data.ownerId) {
      throw new Error('Title and owner ID are required')
    }

    // Generate slug
    const slug = this.generateSlug(data.title)
    const uniqueSlug = `${slug}-${Date.now()}`

    // Generate QR code and share link
    const qrCode = `qr-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/event/${uniqueSlug}`

    // Create event
    return this.eventRepository.create({
      ...data,
      slug: uniqueSlug,
      qrCode,
      shareLink,
      status: EventStatus.DRAFT,
    })
  }

  async updateEvent(id: string, data: UpdateEventDto) {
    // Check if event exists
    await this.getEventById(id)

    // Business logic (e.g., can't update if published)
    // TODO: Add business rules here
    // const event = await this.getEventById(id)
    // if (event.status === 'PUBLISHED') {
    //   throw new Error('Cannot update published event')
    // }

    return this.eventRepository.update(id, data)
  }

  async deleteEvent(id: string): Promise<void> {
    // Check if event exists
    await this.getEventById(id)

    // Business logic (e.g., can't delete if live)
    // TODO: Add business rules here
    // const event = await this.getEventById(id)
    // if (event.status === 'LIVE') {
    //   throw new Error('Cannot delete live event')
    // }

    await this.eventRepository.delete(id)
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
}

