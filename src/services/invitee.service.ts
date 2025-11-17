import { InviteeRepository } from '@/repositories/invitee.repository'
import { CreateInviteeDto, BulkCreateInviteesDto, UpdateInviteeDto, GetInviteesFilters } from '@/types/invitee.types'

export class InviteeService {
  private inviteeRepository: InviteeRepository

  constructor() {
    this.inviteeRepository = new InviteeRepository()
  }

  async getInviteesByEventId(eventId: string, filters?: GetInviteesFilters) {
    return this.inviteeRepository.findAllByEventId(eventId, filters)
  }

  async getInviteeById(id: string) {
    const invitee = await this.inviteeRepository.findById(id)
    if (!invitee) {
      throw new Error('Invitee not found')
    }
    return invitee
  }

  async createInvitee(eventId: string, data: CreateInviteeDto) {
    // Business logic validation
    if (!data.name) {
      throw new Error('Name is required')
    }

    return this.inviteeRepository.create(eventId, data)
  }

  async bulkCreateInvitees(eventId: string, data: BulkCreateInviteesDto): Promise<{ count: number }> {
    // Business logic validation
    if (!data.invitees || !Array.isArray(data.invitees) || data.invitees.length === 0) {
      throw new Error('Invitees array is required and must not be empty')
    }

    // Validate each invitee
    for (const invitee of data.invitees) {
      if (!invitee.name) {
        throw new Error('All invitees must have a name')
      }
    }

    const result = await this.inviteeRepository.createMany(eventId, data)
    return { count: result.count }
  }

  async updateInvitee(id: string, data: UpdateInviteeDto) {
    // Check if invitee exists
    await this.getInviteeById(id)

    return this.inviteeRepository.update(id, data)
  }

  async deleteInvitee(id: string): Promise<void> {
    // Check if invitee exists
    await this.getInviteeById(id)

    await this.inviteeRepository.delete(id)
  }
}

