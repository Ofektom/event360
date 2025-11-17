import { ScheduleRepository } from '@/repositories/schedule.repository'
import { CreateScheduleItemDto, UpdateScheduleItemDto } from '@/types/schedule.types'

export class ScheduleService {
  private scheduleRepository: ScheduleRepository

  constructor() {
    this.scheduleRepository = new ScheduleRepository()
  }

  async getScheduleByCeremonyId(ceremonyId: string) {
    return this.scheduleRepository.findAllByCeremonyId(ceremonyId)
  }

  async getScheduleItemById(id: string) {
    const item = await this.scheduleRepository.findById(id)
    if (!item) {
      throw new Error('Schedule item not found')
    }
    return item
  }

  async createScheduleItem(ceremonyId: string, data: CreateScheduleItemDto) {
    // Business logic validation
    if (!data.title || !data.startTime) {
      throw new Error('Title and start time are required')
    }

    // If order not provided, get the next order number
    let order = data.order
    if (!order) {
      const lastOrder = await this.scheduleRepository.findLastOrderByCeremonyId(ceremonyId)
      order = lastOrder + 1
    }

    return this.scheduleRepository.create(ceremonyId, {
      ...data,
      order,
    })
  }

  async updateScheduleItem(id: string, data: UpdateScheduleItemDto) {
    // Check if item exists
    await this.getScheduleItemById(id)

    return this.scheduleRepository.update(id, data)
  }

  async deleteScheduleItem(id: string): Promise<void> {
    // Check if item exists
    await this.getScheduleItemById(id)

    await this.scheduleRepository.delete(id)
  }
}

