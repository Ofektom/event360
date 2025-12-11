import { prisma } from '@/lib/prisma'
import { CreateScheduleItemDto, UpdateScheduleItemDto } from '@/types/schedule.types'
import { Prisma } from '@prisma/client'

export class ScheduleRepository {
  async findAllByCeremonyId(ceremonyId: string) {
    return prisma.scheduleItem.findMany({
      where: { ceremonyId },
      orderBy: { order: 'asc' },
    })
  }

  async findById(id: string) {
    return prisma.scheduleItem.findUnique({
      where: { id },
      include: {
        ceremony: {
          select: {
            id: true,
            name: true,
            eventId: true,
          },
        },
      },
    })
  }

  async findLastOrderByCeremonyId(ceremonyId: string) {
    const lastItem = await prisma.scheduleItem.findFirst({
      where: { ceremonyId },
      orderBy: { order: 'desc' },
    })
    return lastItem?.order || 0
  }

  async create(ceremonyId: string, data: CreateScheduleItemDto & { order: number }) {
    return prisma.scheduleItem.create({
      data: {
        ceremonyId,
        title: data.title,
        description: data.description || null,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        order: data.order,
        // Type and location are ceremony-level, not item-level, so they should be null
        type: data.type || null,
        location: data.location || null,
        notes: data.notes || null,
      },
    })
  }

  async update(id: string, data: UpdateScheduleItemDto) {
    const updateData: Prisma.ScheduleItemUpdateInput = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime)
    if (data.endTime !== undefined) updateData.endTime = data.endTime ? new Date(data.endTime) : null
    if (data.order !== undefined) updateData.order = data.order
    if (data.type !== undefined) updateData.type = data.type
    if (data.location !== undefined) updateData.location = data.location
    if (data.notes !== undefined) updateData.notes = data.notes

    return prisma.scheduleItem.update({
      where: { id },
      data: updateData,
    })
  }

  async delete(id: string) {
    await prisma.scheduleItem.delete({
      where: { id },
    })
  }
}

