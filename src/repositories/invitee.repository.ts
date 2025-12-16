import { prisma } from '@/lib/prisma'
import { CreateInviteeDto, BulkCreateInviteesDto, UpdateInviteeDto, GetInviteesFilters } from '@/types/invitee.types'
import { Prisma } from '@prisma/client'

export class InviteeRepository {
  async findAllByEventId(eventId: string, filters?: GetInviteesFilters) {
    return prisma.invitee.findMany({
      where: {
        eventId,
        ...(filters?.rsvpStatus && { rsvpStatus: filters.rsvpStatus }),
      },
      include: {
        _count: {
          select: {
            invites: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findById(id: string) {
    return prisma.invitee.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        invites: true,
      },
    })
  }

  async create(eventId: string, data: CreateInviteeDto & { userId?: string | null, registeredAt?: Date | null }) {
    return prisma.invitee.create({
      data: {
        eventId,
        userId: data.userId || null, // Link to user if provided
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        whatsapp: data.phone || null, // Store same value in whatsapp field for backward compatibility
        messenger: data.messenger,
        instagram: data.instagram,
        role: data.role,
        group: data.group,
        notificationChannels: (data.notificationChannels || ['EMAIL']) as any, // Type assertion until Prisma client is regenerated
        registeredAt: data.registeredAt || null,
        rsvpStatus: 'PENDING',
      },
    })
  }

  async createMany(eventId: string, data: BulkCreateInviteesDto) {
    return prisma.invitee.createMany({
      data: data.invitees.map((invitee) => ({
        eventId,
        name: invitee.name,
        email: invitee.email || null,
        phone: invitee.phone || null,
        whatsapp: invitee.phone || null, // Use phone for whatsapp
        messenger: invitee.messenger,
        instagram: invitee.instagram,
        role: invitee.role,
        group: invitee.group,
        notificationChannels: (invitee.notificationChannels || ['EMAIL']) as any,
        rsvpStatus: 'PENDING',
      })),
      skipDuplicates: true,
    })
  }

  async update(id: string, data: UpdateInviteeDto) {
    const updateData: Prisma.InviteeUpdateInput = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp
    if (data.messenger !== undefined) updateData.messenger = data.messenger
    if (data.instagram !== undefined) updateData.instagram = data.instagram
    if (data.role !== undefined) updateData.role = data.role
    if (data.group !== undefined) updateData.group = data.group
    if (data.rsvpStatus !== undefined) {
      updateData.rsvpStatus = data.rsvpStatus
      updateData.rsvpDate = new Date()
    }
    if (data.rsvpNotes !== undefined) updateData.rsvpNotes = data.rsvpNotes
    if (data.notificationChannels !== undefined) (updateData as any).notificationChannels = data.notificationChannels

    return prisma.invitee.update({
      where: { id },
      data: updateData,
    })
  }

  async delete(id: string) {
    await prisma.invitee.delete({
      where: { id },
    })
  }
}

