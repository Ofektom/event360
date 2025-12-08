import { prisma } from '@/lib/prisma'
import { CreateEventDto, UpdateEventDto, GetEventsFilters } from '@/types/event.types'
import { EventStatus } from '@/types/enums'
import { Prisma } from '@prisma/client'

export class EventRepository {
  async findAll(filters: GetEventsFilters) {
    // Try with orderBy first, but fallback gracefully if it fails
    try {
      return await prisma.event.findMany({
        where: {
          ownerId: filters.ownerId,
          ...(filters.familyId && { familyId: filters.familyId }),
          ...(filters.status && { status: filters.status }),
        },
        select: {
          // Explicitly select fields to avoid visibility column issue
          id: true,
          title: true,
          description: true,
          slug: true,
          type: true,
          status: true,
          ownerId: true,
          familyId: true,
          themeId: true,
          startDate: true,
          endDate: true,
          location: true,
          timezone: true,
          isPublic: true,
          allowGuestUploads: true,
          allowComments: true,
          allowReactions: true,
          qrCode: true,
          shareLink: true,
          customTheme: true,
          createdAt: true,
          updatedAt: true,
          theme: true,
          ceremonies: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              invitees: true,
              mediaAssets: true,
              ceremonies: true,
              interactions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } catch (error: any) {
      // If ceremonies orderBy fails or visibility column doesn't exist, try without orderBy
      const errorMessage = error?.message || ''
      const errorCode = error?.code || ''
      if (
        errorCode === 'P2022' || // Column doesn't exist
        errorMessage.includes('visibility') ||
        errorMessage.includes('order') || 
        errorMessage.includes('Unknown column') ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('Invalid value')
      ) {
        console.log('Query failed, trying without problematic fields:', errorMessage)
        try {
          return await prisma.event.findMany({
            where: {
              ownerId: filters.ownerId,
              ...(filters.familyId && { familyId: filters.familyId }),
              ...(filters.status && { status: filters.status }),
            },
            select: {
              // Explicitly select fields, excluding visibility
              id: true,
              title: true,
              description: true,
              slug: true,
              type: true,
              status: true,
              ownerId: true,
              familyId: true,
              themeId: true,
              startDate: true,
              endDate: true,
              location: true,
              timezone: true,
              isPublic: true,
              allowGuestUploads: true,
              allowComments: true,
              allowReactions: true,
              qrCode: true,
              shareLink: true,
              customTheme: true,
              createdAt: true,
              updatedAt: true,
              theme: true,
              ceremonies: true, // Without orderBy
              _count: {
                select: {
                  invitees: true,
                  mediaAssets: true,
                  ceremonies: true,
                  interactions: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        } catch (fallbackError: any) {
          console.error('Fallback query also failed:', fallbackError)
          // Last resort: minimal query without ceremonies
          return prisma.event.findMany({
            where: {
              ownerId: filters.ownerId,
              ...(filters.familyId && { familyId: filters.familyId }),
              ...(filters.status && { status: filters.status }),
            },
            select: {
              id: true,
              title: true,
              description: true,
              slug: true,
              type: true,
              status: true,
              ownerId: true,
              startDate: true,
              endDate: true,
              location: true,
              createdAt: true,
              theme: true,
              _count: {
                select: {
                  invitees: true,
                  mediaAssets: true,
                  ceremonies: true,
                  interactions: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        }
      }
      // If it's a different error, throw it
      throw error
    }
  }

  async findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        theme: true,
        family: true,
        ceremonies: {
          orderBy: { order: 'asc' },
          include: {
            scheduleItems: {
              orderBy: { order: 'asc' },
            },
            _count: {
              select: {
                mediaAssets: true,
              },
            },
          },
        },
        _count: {
          select: {
            invitees: true,
            mediaAssets: true,
            interactions: true,
            eventVendors: true,
          },
        },
      },
    })
  }

  async findBySlug(slug: string) {
    return prisma.event.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        theme: true,
        ceremonies: {
          orderBy: { order: 'asc' },
          include: {
            scheduleItems: {
              orderBy: { order: 'asc' },
            },
            _count: {
              select: {
                mediaAssets: true,
              },
            },
          },
        },
        _count: {
          select: {
            invitees: true,
            mediaAssets: true,
            interactions: true,
            eventVendors: true,
          },
        },
      },
    })
  }

  async create(data: CreateEventDto & { slug: string; qrCode: string; shareLink: string; status: EventStatus }) {
    // Visibility defaults to PUBLIC in schema, so isPublic should be true for new events
    // This ensures new events are accessible via public link by default
    const visibility = 'PUBLIC' // Default from schema
    const isPublic = true // Auto-sync: PUBLIC visibility = isPublic true
    
    return prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        slug: data.slug,
        type: data.type || 'CELEBRATION',
        status: data.status as EventStatus,
        ownerId: data.ownerId,
        familyId: data.familyId,
        themeId: data.themeId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location,
        timezone: data.timezone || 'UTC',
        customTheme: data.customTheme,
        qrCode: data.qrCode,
        shareLink: data.shareLink,
        visibility: visibility, // Default to PUBLIC
        isPublic: isPublic, // Auto-synced: true when visibility is PUBLIC
      },
      include: {
        theme: true,
        ceremonies: true,
      },
    })
  }

  async update(id: string, data: UpdateEventDto) {
    const updateData: Prisma.EventUpdateInput = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.status !== undefined) updateData.status = data.status
    if (data.themeId !== undefined) {
      if (data.themeId === null) {
        updateData.theme = { disconnect: true }
      } else {
        updateData.theme = { connect: { id: data.themeId } }
      }
    }
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
    if (data.location !== undefined) updateData.location = data.location
    if (data.timezone !== undefined) updateData.timezone = data.timezone
    if (data.customTheme !== undefined) updateData.customTheme = data.customTheme
    
    // Auto-sync isPublic based on visibility: if visibility is PUBLIC, set isPublic to true
    if (data.visibility !== undefined) {
      updateData.visibility = data.visibility
      // If visibility is being set to PUBLIC, automatically set isPublic to true
      if (data.visibility === 'PUBLIC') {
        updateData.isPublic = true
      } else if (data.isPublic !== undefined) {
        // If visibility is not PUBLIC but isPublic is explicitly set, use that value
        updateData.isPublic = data.isPublic
      }
    } else if (data.isPublic !== undefined) {
      // If only isPublic is being updated (without visibility change), use it
      updateData.isPublic = data.isPublic
    }
    
    if (data.allowGuestUploads !== undefined) updateData.allowGuestUploads = data.allowGuestUploads
    if (data.allowComments !== undefined) updateData.allowComments = data.allowComments
    if (data.allowReactions !== undefined) updateData.allowReactions = data.allowReactions

    return prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        theme: true,
        ceremonies: {
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  async delete(id: string) {
    await prisma.event.delete({
      where: { id },
    })
  }
}

