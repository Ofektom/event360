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
        visibility: true, // Include visibility for access control
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
    // Check visibility === PUBLIC (primary) or isPublic (for backward compatibility)
    if (!userId) {
      const isPublicAccess = event.visibility === 'PUBLIC' || event.isPublic
      return {
        canView: isPublicAccess,
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

/**
 * Check if a user can access a specific ceremony
 * Takes into account ceremony visibility and user's invite status
 */
export async function canAccessCeremony(
  userId: string | null,
  ceremonyId: string
): Promise<boolean> {
  try {
    const ceremony = await prisma.ceremony.findUnique({
      where: { id: ceremonyId },
      select: {
        id: true,
        eventId: true,
        visibility: true,
        event: {
          select: {
            ownerId: true,
            visibility: true,
            isPublic: true,
          },
        },
      },
    })

    if (!ceremony) {
      return false
    }

    // Organizers can always access all ceremonies
    if (userId && ceremony.event.ownerId === userId) {
      return true
    }

    // Check ceremony visibility
    switch (ceremony.visibility) {
      case 'PUBLIC':
        // Public ceremonies are visible to everyone
        return true

      case 'CONNECTED':
        // Connected: Anyone connected to the user (for now, anyone with event access)
        if (!userId) return false
        const eventAccess = await canAccessEvent(userId, ceremony.eventId)
        return eventAccess.canView

      case 'INVITED_ONLY':
        // Only invited guests can see
        if (!userId) return false
        
        // Check if user is invited to this specific ceremony
        const ceremonyInvite = await prisma.invite.findFirst({
          where: {
            ceremonyId: ceremonyId,
            invitee: {
              userId: userId,
            },
            status: {
              in: ['PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED'],
            },
          },
        })

        if (ceremonyInvite) {
          return true
        }

        // Also check if user is an invitee to the event (they can see all ceremonies they're invited to)
        const invitee = await prisma.invitee.findFirst({
          where: {
            eventId: ceremony.eventId,
            userId: userId,
          },
        })

        // If user is an invitee, check if they have an invite to this ceremony
        if (invitee) {
          const hasCeremonyInvite = await prisma.invite.findFirst({
            where: {
              ceremonyId: ceremonyId,
              inviteeId: invitee.id,
            },
          })
          return !!hasCeremonyInvite
        }

        return false

      default:
        return false
    }
  } catch (error) {
    console.error('Error checking ceremony access:', error)
    return false
  }
}

