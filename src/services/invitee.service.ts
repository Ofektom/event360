import { InviteeRepository } from '@/repositories/invitee.repository'
import { CreateInviteeDto, BulkCreateInviteesDto, UpdateInviteeDto, GetInviteesFilters } from '@/types/invitee.types'
import { prisma } from '@/lib/prisma'
import { normalizePhone } from '@/lib/phone-utils'

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

    // Normalize phone number
    const normalizedPhone = data.phone ? normalizePhone(data.phone) : null
    const normalizedEmail = data.email ? data.email.trim().toLowerCase() : null

    // Check if user already exists by email or phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ]
      },
      select: { 
        id: true,
        email: true,
        phone: true,
        name: true,
      }
    })

    // Create invitee with user link if found
    return this.inviteeRepository.create(eventId, {
      ...data,
      phone: normalizedPhone || undefined,
      email: normalizedEmail || undefined,
      userId: existingUser?.id || null,
      registeredAt: existingUser ? new Date() : null,
    })
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

    // For bulk operations, we need to check each invitee for existing users
    // and create them individually to support user linking
    let createdCount = 0
    for (const inviteeData of data.invitees) {
      try {
        await this.createInvitee(eventId, inviteeData)
        createdCount++
      } catch (error: any) {
        // Skip duplicates or other errors, continue with next invitee
        console.warn(`Failed to create invitee ${inviteeData.name}:`, error.message)
      }
    }

    return { count: createdCount }
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

