import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppInvite } from '@/services/invite/whatsapp.service'
import { sendMessengerInvite } from '@/services/invite/messenger.service'
import { sendInAppInvite } from '@/services/invite/in-app.service'
import { sendEmailInvite } from '@/services/invite/email.service'
import { sendInstagramDMInvite } from '@/services/invite/instagram.service'
import { InviteChannel } from '@prisma/client'
import { randomBytes } from 'crypto'

interface SendInvitesRequest {
  eventId: string
  designId: string
  channel: string
  contacts: Array<{
    name: string
    contactInfo: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body: SendInvitesRequest = await request.json()

    const { eventId, designId, channel, contacts } = body

    // Validate input
    if (!eventId || !designId || !channel || !contacts || contacts.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true, title: true, slug: true },
    })

    if (!event || event.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Verify design exists and belongs to event
    const design = await prisma.invitationDesign.findUnique({
      where: { id: designId },
      select: { eventId: true, imageUrl: true, customImage: true },
    })

    if (!design || design.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Invitation design not found' },
        { status: 404 }
      )
    }

    // Get invitation image URL
    const invitationImageUrl = design.imageUrl || design.customImage
    if (!invitationImageUrl) {
      return NextResponse.json(
        { error: 'Invitation design has no image' },
        { status: 400 }
      )
    }

    // Generate share link with full event URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareLink = event.slug
      ? `${baseUrl}/events/${event.slug}`
      : `${baseUrl}/events/${eventId}`

    const inviteChannel = channel as InviteChannel
    let sent = 0
    let failed = 0
    const errors: string[] = []

    // Send invitations for each contact
    for (const contact of contacts) {
      try {
        // Generate unique token for tracking
        const token = randomBytes(32).toString('hex')

        // Find or create invitee
        let invitee = await prisma.invitee.findFirst({
          where: {
            eventId,
            OR: [
              { email: inviteChannel === 'EMAIL' ? contact.contactInfo : undefined },
              { phone: ['WHATSAPP', 'SMS'].includes(inviteChannel) ? contact.contactInfo : undefined },
              { whatsapp: inviteChannel === 'WHATSAPP' ? contact.contactInfo : undefined },
              { messenger: inviteChannel === 'FACEBOOK_MESSENGER' ? contact.contactInfo : undefined },
              { instagram: inviteChannel === 'INSTAGRAM_DM' ? contact.contactInfo : undefined },
            ],
          },
        })

        // Create invitee if not found
        if (!invitee) {
          const inviteeData: any = {
            eventId,
            name: contact.name,
          }

          // Set contact info based on channel
          switch (inviteChannel) {
            case 'EMAIL':
              inviteeData.email = contact.contactInfo
              break
            case 'WHATSAPP':
              inviteeData.whatsapp = contact.contactInfo
              inviteeData.phone = contact.contactInfo // Also set phone if not set
              break
            case 'SMS':
              inviteeData.phone = contact.contactInfo
              break
            case 'FACEBOOK_MESSENGER':
              inviteeData.messenger = contact.contactInfo
              break
            case 'INSTAGRAM_DM':
              inviteeData.instagram = contact.contactInfo.replace('@', '')
              break
          }

          invitee = await prisma.invitee.create({
            data: inviteeData,
          })
        } else {
          // Update invitee name if different
          if (invitee.name !== contact.name) {
            invitee = await prisma.invitee.update({
              where: { id: invitee.id },
              data: { name: contact.name },
            })
          }

          // Update contact info if not set
          const updateData: any = {}
          switch (inviteChannel) {
            case 'EMAIL':
              if (!invitee.email) updateData.email = contact.contactInfo
              break
            case 'WHATSAPP':
              if (!invitee.whatsapp) updateData.whatsapp = contact.contactInfo
              if (!invitee.phone) updateData.phone = contact.contactInfo
              break
            case 'SMS':
              if (!invitee.phone) updateData.phone = contact.contactInfo
              break
            case 'FACEBOOK_MESSENGER':
              if (!invitee.messenger) updateData.messenger = contact.contactInfo
              break
            case 'INSTAGRAM_DM':
              if (!invitee.instagram) updateData.instagram = contact.contactInfo.replace('@', '')
              break
          }

          if (Object.keys(updateData).length > 0) {
            invitee = await prisma.invitee.update({
              where: { id: invitee.id },
              data: updateData,
            })
          }
        }

        // Create invite record
        const invite = await prisma.invite.create({
          data: {
            eventId,
            inviteeId: invitee.id,
            email: inviteChannel === 'EMAIL' ? contact.contactInfo : null,
            phone: ['WHATSAPP', 'SMS'].includes(inviteChannel) ? contact.contactInfo : null,
            channel: inviteChannel,
            status: 'PENDING',
            token,
          },
        })

        // Send invitation via appropriate service
        let sendResult: { success: boolean; error?: string } = { success: false }

        switch (inviteChannel) {
          case 'WHATSAPP':
            sendResult = await sendWhatsAppInvite({
              to: contact.contactInfo,
              inviteeName: contact.name,
              eventTitle: event.title,
              invitationImageUrl,
              shareLink,
              token,
            })
            break
          case 'FACEBOOK_MESSENGER':
            sendResult = await sendMessengerInvite({
              to: contact.contactInfo,
              inviteeName: contact.name,
              eventTitle: event.title,
              invitationImageUrl,
              shareLink,
              token,
            })
            break
          case 'INSTAGRAM_DM':
            sendResult = await sendInstagramDMInvite({
              to: contact.contactInfo.replace('@', ''),
              inviteeName: contact.name,
              eventTitle: event.title,
              invitationImageUrl,
              shareLink,
              token,
            })
            break
          case 'EMAIL':
            sendResult = await sendEmailInvite({
              to: contact.contactInfo,
              inviteeName: contact.name,
              eventTitle: event.title,
              invitationImageUrl,
              shareLink,
              token,
            })
            break
          case 'LINK':
            // For in-app users, find by email or create user link
            const user = await prisma.user.findUnique({
              where: { email: contact.contactInfo },
            })
            if (user) {
              // Link invitee to user if not already linked
              if (!invitee.userId) {
                await prisma.invitee.update({
                  where: { id: invitee.id },
                  data: { userId: user.id },
                })
              }
              sendResult = await sendInAppInvite({
                userId: user.id,
                inviteeName: contact.name,
                eventTitle: event.title,
                invitationImageUrl,
                shareLink,
                token,
                inviteId: invite.id,
              })
            } else {
              sendResult = { success: false, error: 'User not found' }
            }
            break
          default:
            sendResult = { success: false, error: 'Unsupported channel' }
        }

        if (sendResult.success) {
          // Update invite status
          await prisma.invite.update({
            where: { id: invite.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          })
          sent++
        } else {
          // Update invite with error
          await prisma.invite.update({
            where: { id: invite.id },
            data: {
              status: 'FAILED',
              error: sendResult.error || 'Failed to send',
            },
          })
          failed++
          errors.push(`${contact.name}: ${sendResult.error || 'Failed'}`)
        }
      } catch (error: any) {
        console.error(`Error sending invite to ${contact.name}:`, error)
        failed++
        errors.push(`${contact.name}: ${error.message || 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      sent,
      failed,
      total: sent + failed,
      errors: errors.slice(0, 10), // Limit errors to first 10
    })
  } catch (error: any) {
    console.error('Error sending invitations:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: error.message || 'Failed to send invitations' },
      { status: 500 }
    )
  }
}
