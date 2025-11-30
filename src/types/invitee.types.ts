import { RSVPStatus } from './enums'

// Request DTOs
export interface CreateInviteeDto {
  name: string
  email?: string
  phone?: string
  whatsapp?: string
  messenger?: string
  instagram?: string
  role?: string
  group?: string
  preferredChannel?: string
}

export interface BulkCreateInviteesDto {
  invitees: CreateInviteeDto[]
}

export interface UpdateInviteeDto {
  name?: string
  email?: string
  phone?: string
  whatsapp?: string
  messenger?: string
  instagram?: string
  role?: string
  group?: string
  rsvpStatus?: RSVPStatus
  rsvpNotes?: string
  preferredChannel?: string
}

export interface GetInviteesFilters {
  rsvpStatus?: RSVPStatus
}

