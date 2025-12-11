import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppInvite } from '@/services/invite/whatsapp.service'
import { sendMessengerInvite } from '@/services/invite/messenger.service'
import { sendInAppInvite } from '@/services/invite/in-app.service'
import { sendEmailInvite } from '@/services/invite/email.service'
import { sendInstagramDMInvite } from '@/services/invite/instagram.service'
import { sendGuestInvitationNotification } from '@/services/notification/notification.service'
import { InviteChannel, NotificationChannel } from '@prisma/client'
import { randomBytes } from 'crypto'
import { uploadDataUrlToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'

interface SendInvitesRequest {
  eventId: string
  designId: string
  channel: string
  ceremonyIds?: string[] // Optional: Array of ceremony IDs to invite to (if not provided, invites to all ceremonies)
  contacts: Array<{
    name: string
    contactInfo: string
  }>
}

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log(`[${requestId}] 📨 Send Invitations Request Started`)
    
    // Log request details
    const user = await requireAuth()
    console.log(`[${requestId}] ✅ User authenticated: ${user.id} (${user.email})`)
    
    let body: SendInvitesRequest
    try {
      body = await request.json()
      console.log(`[${requestId}] 📦 Request body received:`, {
        eventId: body.eventId,
        designId: body.designId,
        channel: body.channel,
        contactsCount: body.contacts?.length || 0,
        contacts: body.contacts?.map(c => ({ name: c.name, contactInfo: c.contactInfo }))
      })
    } catch (parseError: any) {
      console.error(`[${requestId}] ❌ Failed to parse request body:`, parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError.message },
        { status: 400 }
      )
    }

    const { eventId, designId, channel, ceremonyIds, contacts } = body

    // Validate input with detailed logging
    console.log(`[${requestId}] 🔍 Validating input...`)
    console.log(`[${requestId}]   - eventId: ${eventId ? '✅' : '❌'} ${eventId || 'MISSING'}`)
    console.log(`[${requestId}]   - designId: ${designId ? '✅' : '❌'} ${designId || 'MISSING'}`)
    console.log(`[${requestId}]   - channel: ${channel ? '✅' : '❌'} ${channel || 'MISSING'}`)
    console.log(`[${requestId}]   - contacts: ${contacts ? '✅' : '❌'} ${contacts?.length || 0} contact(s)`)
    
    if (!eventId || !designId || !channel || !contacts || contacts.length === 0) {
      const missingFields = []
      if (!eventId) missingFields.push('eventId')
      if (!designId) missingFields.push('designId')
      if (!channel) missingFields.push('channel')
      if (!contacts || contacts.length === 0) missingFields.push('contacts')
      
      console.error(`[${requestId}] ❌ Validation failed - Missing fields:`, missingFields)
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missingFields,
          received: { eventId, designId, channel, contactsCount: contacts?.length || 0 }
        },
        { status: 400 }
      )
    }

    // Verify user owns the event
    console.log(`[${requestId}] 🔍 Fetching event: ${eventId}`)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true, title: true, slug: true },
    })

    if (!event) {
      console.error(`[${requestId}] ❌ Event not found: ${eventId}`)
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.ownerId !== user.id) {
      console.error(`[${requestId}] ❌ Unauthorized - Event owner mismatch. Event owner: ${event.ownerId}, User: ${user.id}`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    console.log(`[${requestId}] ✅ Event verified: ${event.title}`)

    // Verify design exists and belongs to event
    console.log(`[${requestId}] 🔍 Fetching design: ${designId}`)
    const design = await prisma.invitationDesign.findUnique({
      where: { id: designId },
      select: { eventId: true, imageUrl: true, customImage: true },
    })

    if (!design) {
      console.error(`[${requestId}] ❌ Design not found: ${designId}`)
      return NextResponse.json(
        { error: 'Invitation design not found' },
        { status: 404 }
      )
    }

    if (design.eventId !== eventId) {
      console.error(`[${requestId}] ❌ Design event mismatch. Design event: ${design.eventId}, Request event: ${eventId}`)
      return NextResponse.json(
        { error: 'Invitation design does not belong to this event' },
        { status: 400 }
      )
    }

    // Get invitation image URL
    let invitationImageUrl = design.imageUrl || design.customImage
    console.log(`[${requestId}] 🖼️  Image URL: ${invitationImageUrl ? '✅' : '❌'} ${invitationImageUrl ? (invitationImageUrl.startsWith('data:') ? 'Data URL' : invitationImageUrl.substring(0, 50)) : 'MISSING'}`)
    
    if (!invitationImageUrl) {
      console.error(`[${requestId}] ❌ Design has no image. imageUrl: ${design.imageUrl}, customImage: ${design.customImage}`)
      return NextResponse.json(
        { 
          error: 'Invitation design has no image',
          designId,
          imageUrl: design.imageUrl,
          customImage: design.customImage
        },
        { status: 400 }
      )
    }

    // Convert data URL to Cloudinary URL if needed
    // WhatsApp and other APIs require absolute HTTP/HTTPS URLs, not data URLs
    if (invitationImageUrl.startsWith('data:')) {
      console.log(`[${requestId}] 🔄 Converting data URL to Cloudinary URL...`)
      
      if (isCloudinaryConfigured()) {
        try {
          // Upload data URL to Cloudinary
          const uploadType = 'invitation'
          const folder = `event360/${uploadType}/${eventId}`
          
          const result = await uploadDataUrlToCloudinary(invitationImageUrl, {
            folder,
            publicId: `invitation-${designId}-${Date.now()}`,
            overwrite: false,
          })
          
          invitationImageUrl = result.secureUrl
          console.log(`[${requestId}] ✅ Uploaded data URL to Cloudinary: ${invitationImageUrl.substring(0, 100)}...`)
          
          // Update the design record with the Cloudinary URL for future use
          try {
            await prisma.invitationDesign.update({
              where: { id: designId },
              data: {
                imageUrl: result.secureUrl,
                customImage: design.customImage?.startsWith('data:') ? result.secureUrl : design.customImage,
              },
            })
            console.log(`[${requestId}] ✅ Updated design record with Cloudinary URL`)
          } catch (updateError) {
            // Log but don't fail - the URL is still valid for this send
            console.warn(`[${requestId}] ⚠️ Failed to update design record:`, updateError)
          }
        } catch (cloudinaryError: any) {
          console.error(`[${requestId}] ❌ Failed to upload to Cloudinary:`, cloudinaryError.message)
          // Fallback to API endpoint method (less ideal but works)
          const { getBaseUrl } = await import('@/lib/utils')
          const baseUrl = getBaseUrl()
          const encodedDataUrl = encodeURIComponent(invitationImageUrl)
          invitationImageUrl = `${baseUrl}/api/invitations/image?data=${encodedDataUrl}`
          console.log(`[${requestId}] ⚠️ Fallback: Using API endpoint URL: ${invitationImageUrl.substring(0, 100)}...`)
        }
      } else {
        // Cloudinary not configured - use API endpoint as fallback
        console.log(`[${requestId}] ⚠️ Cloudinary not configured, using API endpoint fallback...`)
        const { getBaseUrl } = await import('@/lib/utils')
        const baseUrl = getBaseUrl()
        const encodedDataUrl = encodeURIComponent(invitationImageUrl)
        invitationImageUrl = `${baseUrl}/api/invitations/image?data=${encodedDataUrl}`
        console.log(`[${requestId}] ⚠️ Using API endpoint URL: ${invitationImageUrl.substring(0, 100)}...`)
        console.log(`[${requestId}] ⚠️ Note: Configure Cloudinary for better reliability`)
      }
    } else if (invitationImageUrl.startsWith('/')) {
      // Relative URL - convert to absolute
      const { getBaseUrl } = await import('@/lib/utils')
      const baseUrl = getBaseUrl()
      invitationImageUrl = `${baseUrl}${invitationImageUrl}`
      console.log(`[${requestId}] ✅ Converted relative URL to absolute: ${invitationImageUrl}`)
    }

    // Generate share link with full event URL (reuse baseUrl if already imported)
    const baseUrl = (await import('@/lib/utils')).getBaseUrl()
    const shareLink = event.slug
      ? `${baseUrl}/e/${event.slug}`
      : `${baseUrl}/events/${eventId}`
    
    console.log(`[${requestId}] 🔗 Share link: ${shareLink}`)

    const inviteChannel = channel as InviteChannel
    console.log(`[${requestId}] 📤 Channel: ${inviteChannel}`)
    
    let sent = 0
    let failed = 0
    const errors: string[] = []

    // Send invitations for each contact
    console.log(`[${requestId}] 📋 Processing ${contacts.length} contact(s)...`)
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]
      const contactId = `contact_${i + 1}_${Date.now()}`
      
      try {
        console.log(`[${requestId}] [${contactId}] Processing contact: ${contact.name} (${contact.contactInfo})`)
        
        // Generate unique token for tracking
        const token = randomBytes(32).toString('hex')
        console.log(`[${requestId}] [${contactId}] Generated token: ${token.substring(0, 8)}...`)

        // Find or create invitee
        console.log(`[${requestId}] [${contactId}] Searching for existing invitee...`)
        
        // Build OR conditions for finding invitee (filter out undefined values)
        const orConditions: any[] = []
        if (inviteChannel === 'EMAIL' && contact.contactInfo) {
          orConditions.push({ email: contact.contactInfo })
        }
        if (['WHATSAPP', 'SMS'].includes(inviteChannel) && contact.contactInfo) {
          orConditions.push({ phone: contact.contactInfo })
        }
        if (inviteChannel === 'WHATSAPP' && contact.contactInfo) {
          orConditions.push({ whatsapp: contact.contactInfo })
        }
        if (inviteChannel === 'FACEBOOK_MESSENGER' && contact.contactInfo) {
          orConditions.push({ messenger: contact.contactInfo })
        }
        if (inviteChannel === 'INSTAGRAM_DM' && contact.contactInfo) {
          orConditions.push({ instagram: contact.contactInfo.replace('@', '') })
        }
        
        let invitee = orConditions.length > 0 ? await prisma.invitee.findFirst({
          where: {
            eventId,
            OR: orConditions,
          },
        }) : null

        if (invitee) {
          console.log(`[${requestId}] [${contactId}] ✅ Found existing invitee: ${invitee.id}`)
        } else {
          console.log(`[${requestId}] [${contactId}] ➕ Creating new invitee...`)
        }

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

          console.log(`[${requestId}] [${contactId}] Creating invitee with data:`, inviteeData)
          invitee = await prisma.invitee.create({
            data: inviteeData,
          })
          console.log(`[${requestId}] [${contactId}] ✅ Created invitee: ${invitee.id}`)
        } else {
          // Update invitee name if different
          if (invitee.name !== contact.name) {
            console.log(`[${requestId}] [${contactId}] Updating invitee name...`)
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
            console.log(`[${requestId}] [${contactId}] Updating invitee with:`, updateData)
            invitee = await prisma.invitee.update({
              where: { id: invitee.id },
              data: updateData,
            })
          }
        }

        // Determine which ceremonies to invite to
        let targetCeremonyIds: string[] | null[] = []
        
        if (ceremonyIds && ceremonyIds.length > 0) {
          // Verify all ceremony IDs belong to this event
          const ceremonies = await prisma.ceremony.findMany({
            where: {
              id: { in: ceremonyIds },
              eventId,
            },
            select: { id: true },
          })
          
          if (ceremonies.length !== ceremonyIds.length) {
            console.warn(`[${requestId}] [${contactId}] ⚠️ Some ceremony IDs are invalid, using valid ones only`)
          }
          
          targetCeremonyIds = ceremonies.map(c => c.id)
        } else {
          // If no ceremonyIds specified, create event-wide invite (ceremonyId = null)
          targetCeremonyIds = [null]
        }

        // Create invite record(s) - one per ceremony (or one event-wide if no ceremonies specified)
        console.log(`[${requestId}] [${contactId}] Creating invite record(s) for ${targetCeremonyIds.length} ceremony(ies)...`)
        
        const invites = await Promise.all(
          targetCeremonyIds.map(async (ceremonyId, index) => {
            // Generate unique token for each ceremony invite
            const inviteToken = ceremonyId 
              ? `${token}_${ceremonyId}_${index}` 
              : index === 0 
                ? token 
                : `${token}_${index}`
            
            return prisma.invite.create({
              data: {
                eventId,
                ceremonyId: ceremonyId || null,
                inviteeId: invitee.id,
                email: inviteChannel === 'EMAIL' ? contact.contactInfo : null,
                phone: ['WHATSAPP', 'SMS'].includes(inviteChannel) ? contact.contactInfo : null,
                channel: inviteChannel,
                status: 'PENDING',
                token: inviteToken,
              },
            })
          })
        )
        
        console.log(`[${requestId}] [${contactId}] ✅ Created ${invites.length} invite(s): ${invites.map(i => i.id).join(', ')}`)
        
        // Use the first invite for tracking (or event-wide invite if exists)
        const invite = invites.find(i => !i.ceremonyId) || invites[0]

        // Send invitation via appropriate service
        // If invitee has preferences or userId, use notification service
        // Otherwise, use the specified channel
        console.log(`[${requestId}] [${contactId}] 📤 Sending invitation via ${inviteChannel}...`)
        let sendResult: { success: boolean; error?: string } = { success: false }

        // If invitee has preferences or userId, use notification service
        const useNotificationService = invitee.userId || (invitee.notificationChannels && invitee.notificationChannels.length > 0)

        if (useNotificationService) {
          // Use notification service that respects preferences
          try {
            const notificationResult = await sendGuestInvitationNotification({
              userId: invitee.userId || undefined,
              inviteeId: invitee.id,
              email: invitee.email || (inviteChannel === 'EMAIL' ? contact.contactInfo : undefined),
              phone: invitee.phone || (inviteChannel === 'WHATSAPP' ? contact.contactInfo : undefined),
              whatsapp: invitee.whatsapp || undefined,
              messenger: invitee.messenger || undefined,
              instagram: invitee.instagram || undefined,
              name: contact.name,
              eventId: eventId,
              eventTitle: event.title,
              invitationImageUrl,
              shareLink,
              token,
            })

            // Check if at least one channel succeeded
            const successfulChannels = notificationResult.channels.filter(c => c.success)
            if (successfulChannels.length > 0) {
              sendResult = { success: true }
              console.log(`[${requestId}] [${contactId}] ✅ Invitation sent via notification service:`, {
                successfulChannels: successfulChannels.map(c => c.channel),
                failedChannels: notificationResult.channels.filter(c => !c.success).map(c => ({ channel: c.channel, error: c.error }))
              })
            } else {
              sendResult = {
                success: false,
                error: notificationResult.error || 'All notification channels failed'
              }
              console.error(`[${requestId}] [${contactId}] ❌ All notification channels failed:`, notificationResult.channels)
            }
          } catch (notificationError: any) {
            console.error(`[${requestId}] [${contactId}] ❌ Notification service error:`, notificationError)
            sendResult = {
              success: false,
              error: notificationError.message || 'Failed to send notification'
            }
          }
        } else {
          // Use legacy single-channel sending
          switch (inviteChannel) {
            case 'WHATSAPP':
              // For WhatsApp, prefer invitee's whatsapp field, then phone, then contactInfo
              const whatsappNumber = invitee.whatsapp || invitee.phone || contact.contactInfo
              console.log(`[${requestId}] [${contactId}] Calling sendWhatsAppInvite with:`, {
                to: whatsappNumber,
                inviteeName: contact.name,
                eventTitle: event.title,
                hasImage: !!invitationImageUrl,
                imageUrl: invitationImageUrl?.substring(0, 100),
                shareLink
              })
              
              if (!whatsappNumber) {
                console.error(`[${requestId}] [${contactId}] ❌ No WhatsApp number found for contact`)
                sendResult = { 
                  success: false, 
                  error: 'No WhatsApp number found. Please ensure the contact has a phone number or WhatsApp ID.' 
                }
              } else {
                try {
                  sendResult = await sendWhatsAppInvite({
                    to: whatsappNumber,
                    inviteeName: contact.name,
                    eventTitle: event.title,
                    invitationImageUrl,
                    shareLink,
                    token,
                  })
                  console.log(`[${requestId}] [${contactId}] WhatsApp send result:`, sendResult)
                } catch (whatsappError: any) {
                  console.error(`[${requestId}] [${contactId}] ❌ WhatsApp send error:`, whatsappError)
                  sendResult = {
                    success: false,
                    error: whatsappError.message || 'Failed to send WhatsApp invitation'
                  }
                }
              }
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
              console.error(`[${requestId}] [${contactId}] ❌ Unsupported channel: ${inviteChannel}`)
              sendResult = { success: false, error: 'Unsupported channel' }
          }
        }

        if (sendResult.success) {
          console.log(`[${requestId}] [${contactId}] ✅ Invitation sent successfully`)
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
          console.error(`[${requestId}] [${contactId}] ❌ Failed to send: ${sendResult.error}`)
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
        console.error(`[${requestId}] [${contactId}] ❌ Error processing contact:`, error)
        console.error(`[${requestId}] [${contactId}] Error stack:`, error.stack)
        failed++
        errors.push(`${contact.name}: ${error.message || 'Unknown error'}`)
      }
    }

    console.log(`[${requestId}] ✅ Request completed. Sent: ${sent}, Failed: ${failed}`)

    return NextResponse.json({
      sent,
      failed,
      total: sent + failed,
      errors: errors.slice(0, 10), // Limit errors to first 10
    })
  } catch (error: any) {
    console.error(`[${requestId}] ❌ Fatal error in send invitations:`, error)
    console.error(`[${requestId}] Error stack:`, error.stack)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { 
        error: error.message || 'Failed to send invitations',
        requestId,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
