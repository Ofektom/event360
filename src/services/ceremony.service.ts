import { CeremonyRepository } from '@/repositories/ceremony.repository'
import { CreateCeremonyDto, UpdateCeremonyDto } from '@/types/ceremony.types'

export class CeremonyService {
  private ceremonyRepository: CeremonyRepository

  constructor() {
    this.ceremonyRepository = new CeremonyRepository()
  }

  async getCeremoniesByEventId(eventId: string) {
    return this.ceremonyRepository.findAllByEventId(eventId)
  }

  async getCeremonyById(id: string) {
    const ceremony = await this.ceremonyRepository.findById(id)
    if (!ceremony) {
      throw new Error('Ceremony not found')
    }
    return ceremony
  }

  async createCeremony(eventId: string, data: CreateCeremonyDto) {
    // Business logic validation
    if (!data.name || !data.date) {
      throw new Error('Name and date are required')
    }

    // If order not provided, get the next order number
    let order: number = data.order ?? 0
    if (!data.order) {
      const lastOrder = await this.ceremonyRepository.findLastOrderByEventId(eventId)
      order = lastOrder + 1
    }

    return this.ceremonyRepository.create(eventId, {
      ...data,
      order,
    })
  }

  async updateCeremony(id: string, data: UpdateCeremonyDto) {
    // Check if ceremony exists
    await this.getCeremonyById(id)

    return this.ceremonyRepository.update(id, data)
  }

  async deleteCeremony(id: string): Promise<void> {
    // Check if ceremony exists
    await this.getCeremonyById(id)

    // Business logic (e.g., can't delete if event is live)
    // TODO: Add business rules here

    await this.ceremonyRepository.delete(id)
  }
}

