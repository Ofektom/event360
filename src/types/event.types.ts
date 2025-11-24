import { EventType, EventStatus, EventVisibility } from './enums'

// Request DTOs
export interface CreateEventDto {
  title: string
  description?: string
  type?: EventType
  ownerId: string
  familyId?: string
  themeId?: string
  startDate?: Date | string
  endDate?: Date | string
  location?: string
  timezone?: string
  customTheme?: any
}

export interface UpdateEventDto {
  title?: string
  description?: string
  type?: EventType
  status?: EventStatus
  themeId?: string
  startDate?: Date | string | null
  endDate?: Date | string | null
  location?: string
  timezone?: string
  customTheme?: any
  isPublic?: boolean
  visibility?: EventVisibility
  allowGuestUploads?: boolean
  allowComments?: boolean
  allowReactions?: boolean
}

export interface GetEventsFilters {
  ownerId: string
  familyId?: string
  status?: EventStatus
}

// Response DTOs
export interface EventResponse {
  id: string
  title: string
  description: string | null
  slug: string
  type: EventType
  status: EventStatus
  themeId: string | null
  ownerId: string
  familyId: string | null
  startDate: Date | null
  endDate: Date | null
  location: string | null
  timezone: string
  isPublic: boolean
  allowGuestUploads: boolean
  allowComments: boolean
  allowReactions: boolean
  qrCode: string | null
  shareLink: string | null
  createdAt: Date
  updatedAt: Date
}

