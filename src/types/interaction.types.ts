import { InteractionType, ReactionType } from './enums'

// Request DTOs
export interface CreateInteractionDto {
  ceremonyId?: string
  mediaAssetId?: string
  userId?: string
  parentId?: string  // For replies to comments
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

