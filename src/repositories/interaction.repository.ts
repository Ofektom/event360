import { prisma } from '@/lib/prisma'
import { CreateInteractionDto, GetInteractionsFilters } from '@/types/interaction.types'
import { Prisma } from '@prisma/client'

export class InteractionRepository {
  async findAllByEventId(eventId: string, filters?: GetInteractionsFilters) {
    const where: any = {
      eventId,
      ...(filters?.ceremonyId && { ceremonyId: filters.ceremonyId }),
      ...(filters?.mediaAssetId && { mediaAssetId: filters.mediaAssetId }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.isApproved !== undefined && { isApproved: filters.isApproved }),
    }
    
    // For comments, only fetch top-level comments (no parentId) by default
    if (filters?.type === 'COMMENT') {
      where.parentId = null
    }
    
    return prisma.interaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        mediaAsset: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })
  }

  async findById(id: string) {
    return prisma.interaction.findUnique({
      where: { id },
      include: {
        user: true,
        mediaAsset: true,
        event: true,
        ceremony: true,
      },
    })
  }

  async create(eventId: string, data: CreateInteractionDto) {
    return prisma.interaction.create({
      data: {
        eventId,
        ceremonyId: data.ceremonyId,
        mediaAssetId: data.mediaAssetId,
        userId: data.userId,
        parentId: data.parentId,
        type: data.type,
        content: data.content,
        reaction: data.reaction,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        isApproved: true,
        isPinned: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        parent: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    })
  }

  async update(id: string, data: { isApproved?: boolean; isPinned?: boolean }) {
    const updateData: Prisma.InteractionUpdateInput = {}
    
    if (data.isApproved !== undefined) updateData.isApproved = data.isApproved
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned

    return prisma.interaction.update({
      where: { id },
      data: updateData,
    })
  }

  async delete(id: string) {
    await prisma.interaction.delete({
      where: { id },
    })
  }
}

