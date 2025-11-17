import { InteractionType, ReactionType } from './enums'

// Request DTOs
export interface CreateInteractionDto {
  ceremonyId?: string
  mediaAssetId?: string
  userId?: string
  type: InteractionType
  content?: string
  reaction?: ReactionType
  guestName?: string
  guestEmail?: string
}

export interface GetInteractionsFilters {
  ceremonyId?: string
  mediaAssetId?: string
  type?: InteractionType
  isApproved?: boolean
}

