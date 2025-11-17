import { prisma } from '@/lib/prisma'
import { CreateMediaAssetDto, GetMediaFilters } from '@/types/media.types'
import { Prisma } from '@prisma/client'

export class MediaRepository {
  async findAllByEventId(eventId: string, filters?: GetMediaFilters) {
    return prisma.mediaAsset.findMany({
      where: {
        eventId,
        ...(filters?.ceremonyId && { ceremonyId: filters.ceremonyId }),
        ...(filters?.isApproved !== undefined && { isApproved: filters.isApproved }),
        ...(filters?.isFeatured !== undefined && { isFeatured: filters.isFeatured }),
        ...(filters?.type && { type: filters.type }),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        ceremony: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            interactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findById(id: string) {
    return prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        uploadedBy: true,
        ceremony: true,
        event: true,
      },
    })
  }

  async create(eventId: string, data: CreateMediaAssetDto) {
    return prisma.mediaAsset.create({
      data: {
        eventId,
        ceremonyId: data.ceremonyId,
        uploadedById: data.uploadedById,
        type: data.type,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        filename: data.filename,
        mimeType: data.mimeType,
        size: data.size || 0,
        width: data.width,
        height: data.height,
        duration: data.duration,
        caption: data.caption,
        tags: data.tags || [],
        source: data.source || 'UPLOAD',
        sourceUrl: data.sourceUrl,
        socialMediaId: data.socialMediaId,
        socialPlatform: data.socialPlatform,
        isApproved: true,
        isFeatured: false,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })
  }

  async update(id: string, data: Partial<CreateMediaAssetDto> & { isApproved?: boolean; isFeatured?: boolean }) {
    const updateData: Prisma.MediaAssetUpdateInput = {}
    
    if (data.caption !== undefined) updateData.caption = data.caption
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.isApproved !== undefined) updateData.isApproved = data.isApproved
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured

    return prisma.mediaAsset.update({
      where: { id },
      data: updateData,
    })
  }

  async delete(id: string) {
    await prisma.mediaAsset.delete({
      where: { id },
    })
  }
}

