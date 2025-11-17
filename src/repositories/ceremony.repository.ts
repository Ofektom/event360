import { prisma } from '@/lib/prisma'
import { CreateCeremonyDto, UpdateCeremonyDto } from '@/types/ceremony.types'
import { Prisma } from '@prisma/client'

export class CeremonyRepository {
  async findAllByEventId(eventId: string) {
    return prisma.ceremony.findMany({
      where: { eventId },
      include: {
        scheduleItems: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            mediaAssets: true,
            interactions: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    })
  }

  async findById(id: string) {
    return prisma.ceremony.findUnique({
      where: { id },
      include: {
        scheduleItems: {
          orderBy: { order: 'asc' },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })
  }

  async findLastOrderByEventId(eventId: string) {
    const lastCeremony = await prisma.ceremony.findFirst({
      where: { eventId },
      orderBy: { order: 'desc' },
    })
    return lastCeremony?.order || 0
  }

  async create(eventId: string, data: CreateCeremonyDto & { order: number }) {
    return prisma.ceremony.create({
      data: {
        eventId,
        name: data.name,
        description: data.description,
        order: data.order,
        date: new Date(data.date),
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        location: data.location,
        venue: data.venue,
        dressCode: data.dressCode,
        notes: data.notes,
        streamUrl: data.streamUrl,
        streamKey: data.streamKey,
        isStreaming: false,
      },
      include: {
        scheduleItems: true,
      },
    })
  }

  async update(id: string, data: UpdateCeremonyDto) {
    const updateData: Prisma.CeremonyUpdateInput = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.order !== undefined) updateData.order = data.order
    if (data.date !== undefined) updateData.date = new Date(data.date)
    if (data.startTime !== undefined) updateData.startTime = data.startTime ? new Date(data.startTime) : null
    if (data.endTime !== undefined) updateData.endTime = data.endTime ? new Date(data.endTime) : null
    if (data.location !== undefined) updateData.location = data.location
    if (data.venue !== undefined) updateData.venue = data.venue
    if (data.dressCode !== undefined) updateData.dressCode = data.dressCode
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.streamUrl !== undefined) updateData.streamUrl = data.streamUrl
    if (data.streamKey !== undefined) updateData.streamKey = data.streamKey
    if (data.isStreaming !== undefined) updateData.isStreaming = data.isStreaming

    return prisma.ceremony.update({
      where: { id },
      data: updateData,
    })
  }

  async delete(id: string) {
    await prisma.ceremony.delete({
      where: { id },
    })
  }
}

