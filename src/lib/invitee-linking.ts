import { prisma } from '@/lib/prisma'
import { normalizePhone } from '@/lib/phone-utils'
import { Prisma } from '@prisma/client'

/**
 * Links a user account to any matching Invitee records based on email/phone
 * This is called after user registration or login
 */
export async function linkUserToInvitees(
  userId: string, 
  email?: string | null, 
  phone?: string | null
) {
  if (!email && !phone) return { linked: 0, invitees: [] }

  try {
    // Normalize phone number for matching
    const normalizedPhone = phone ? normalizePhone(phone) : null
    const normalizedEmail = email ? email.trim().toLowerCase() : null

    // Find invitees that match the user's email or phone and aren't yet linked
    const matchingInvitees = await prisma.invitee.findMany({
      where: {
        AND: [
          { userId: null }, // Not yet linked
          {
            OR: [
              ...(normalizedEmail ? [{ email: { equals: normalizedEmail, mode: Prisma.QueryMode.insensitive } }] : []),
              ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
            ],
          },
        ],
      },
    })

    if (matchingInvitees.length === 0) {
      return { linked: 0, invitees: [] }
    }

    // Link all matching invitees to the user
    const result = await prisma.invitee.updateMany({
      where: {
        id: { in: matchingInvitees.map((inv) => inv.id) },
      },
      data: {
        userId: userId,
        registeredAt: new Date(),
      },
    })

    return {
      linked: result.count,
      invitees: matchingInvitees.map((inv) => ({
        id: inv.id,
        eventId: inv.eventId,
        name: inv.name,
      })),
    }
  } catch (error) {
    console.error('Error linking user to invitees:', error)
    throw error
  }
}

/**
 * Manually link a user to a specific invitee (e.g., via invitation token)
 */
export async function linkUserToInvitee(userId: string, inviteeId: string) {
  try {
    const invitee = await prisma.invitee.findUnique({
      where: { id: inviteeId },
    })

    if (!invitee) {
      throw new Error('Invitee not found')
    }

    if (invitee.userId && invitee.userId !== userId) {
      throw new Error('Invitee is already linked to another user')
    }

    return await prisma.invitee.update({
      where: { id: inviteeId },
      data: {
        userId: userId,
        registeredAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error linking user to invitee:', error)
    throw error
  }
}

/**
 * Get all events a user is invited to (via Invitee records)
 */
export async function getUserInvitedEvents(userId: string) {
  return await prisma.invitee.findMany({
    where: {
      userId: userId,
    },
    include: {
      event: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              invitees: true,
              mediaAssets: true,
              interactions: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

