import { prisma } from '@/lib/prisma'

export interface EventAccess {
  canView: boolean
  canInteract: boolean
  isOrganizer: boolean
  invitee?: {
    id: string
    rsvpStatus: string
    role?: string | null
  } | null
}

/**
 * Check if a user can access an event and what level of access they have
 */
export async function canAccessEvent(
  userId: string | null,
  eventId: string
): Promise<EventAccess> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        ownerId: true,
        isPublic: true,
        status: true,
      },
    })

    if (!event) {
      return {
        canView: false,
        canInteract: false,
        isOrganizer: false,
      }
    }

    // Public events can be viewed by anyone (limited view)
    if (!userId) {
      return {
        canView: event.isPublic,
        canInteract: false,
        isOrganizer: false,
      }
    }

    // Check if user is the organizer
    if (event.ownerId === userId) {
      return {
        canView: true,
        canInteract: true,
        isOrganizer: true,
      }
    }

    // Check if user is a linked invitee
    const invitee = await prisma.invitee.findFirst({
      where: {
        eventId: eventId,
        userId: userId,
        rsvpStatus: {
          in: ['PENDING', 'ACCEPTED', 'MAYBE'],
        },
      },
      select: {
        id: true,
        rsvpStatus: true,
        role: true,
      },
    })

    return {
      canView: true,
      canInteract: !!invitee,
      isOrganizer: false,
      invitee: invitee || null,
    }
  } catch (error) {
    console.error('Error checking event access:', error)
    return {
      canView: false,
      canInteract: false,
      isOrganizer: false,
    }
  }
}

/**
 * Check if user can interact with event (upload, comment, react, etc.)
 */
export async function canInteract(userId: string | null, eventId: string): Promise<boolean> {
  if (!userId) return false

  const access = await canAccessEvent(userId, eventId)
  return access.canInteract || access.isOrganizer
}

/**
 * Check if user is the event organizer
 */
export async function isEventOrganizer(userId: string | null, eventId: string): Promise<boolean> {
  if (!userId) return false

  const access = await canAccessEvent(userId, eventId)
  return access.isOrganizer
}

/**
 * Get user's access level for multiple events
 */
export async function getEventsAccess(
  userId: string | null,
  eventIds: string[]
): Promise<Record<string, EventAccess>> {
  const accessMap: Record<string, EventAccess> = {}

  await Promise.all(
    eventIds.map(async (eventId) => {
      accessMap[eventId] = await canAccessEvent(userId, eventId)
    })
  )

  return accessMap
}

