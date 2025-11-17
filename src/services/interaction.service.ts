import { InteractionRepository } from '@/repositories/interaction.repository'
import { CreateInteractionDto, GetInteractionsFilters } from '@/types/interaction.types'

export class InteractionService {
  private interactionRepository: InteractionRepository

  constructor() {
    this.interactionRepository = new InteractionRepository()
  }

  async getInteractionsByEventId(eventId: string, filters?: GetInteractionsFilters) {
    return this.interactionRepository.findAllByEventId(eventId, filters)
  }

  async getInteractionById(id: string) {
    const interaction = await this.interactionRepository.findById(id)
    if (!interaction) {
      throw new Error('Interaction not found')
    }
    return interaction
  }

  async createInteraction(eventId: string, data: CreateInteractionDto) {
    // Business logic validation
    if (!data.type) {
      throw new Error('Interaction type is required')
    }

    // Validate reaction type
    if (data.type === 'REACTION' && !data.reaction) {
      throw new Error('Reaction type is required for reaction interactions')
    }

    // Validate content for comments/guestbook
    if ((data.type === 'COMMENT' || data.type === 'GUESTBOOK') && !data.content) {
      throw new Error('Content is required for comment/guestbook interactions')
    }

    // Validate guest info for non-authenticated users
    if (!data.userId && !data.guestName) {
      throw new Error('Either userId or guestName is required')
    }

    return this.interactionRepository.create(eventId, data)
  }

  async updateInteraction(id: string, data: { isApproved?: boolean; isPinned?: boolean }) {
    // Check if interaction exists
    await this.getInteractionById(id)

    return this.interactionRepository.update(id, data)
  }

  async deleteInteraction(id: string): Promise<void> {
    // Check if interaction exists
    await this.getInteractionById(id)

    await this.interactionRepository.delete(id)
  }
}

