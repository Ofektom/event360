import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { UserProfileHeader } from '@/components/organisms/UserProfileHeader'
import { UserStats } from '@/components/organisms/UserStats'
import { UserEventsList } from '@/components/organisms/UserEventsList'
import { UserMediaGrid } from '@/components/organisms/UserMediaGrid'
import { Card } from '@/components/atoms/Card'
import { prisma } from '@/lib/prisma'
import { getUserInvitedEvents } from '@/lib/invitee-linking'

// This page uses getCurrentUser() which accesses headers, so it must be dynamic
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const sessionUser = await getCurrentUser()

  if (!sessionUser) {
    redirect('/auth/signin')
  }

  try {
    // Fetch full user from database to get all fields including phone
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return (
        <DashboardLayout>
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="text-gray-600">Unable to load your profile.</p>
          </Card>
        </DashboardLayout>
      )
    }

    // Fetch user-related data using userId as foreign key
    // Profile should only fetch user data, events are separate entities
    // Use individual try-catch blocks to handle errors gracefully
    let createdEvents: any[] = []
    let invitedEvents: any[] = []
    let mediaAssets: any[] = []
    let interactions: any[] = []
    let stats = {
      eventsCreated: 0,
      eventsInvited: 0,
      mediaUploaded: 0,
      interactionsMade: 0,
    }

    try {
      // Fetch events where user is owner
      createdEvents = await prisma.event.findMany({
        where: { ownerId: user.id },
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
      }).catch((error: any) => {
        console.error('Error fetching created events:', error)
        // Return empty array if query fails
        return []
      })
    } catch (error) {
      console.error('Error fetching created events:', error)
    }

    try {
      invitedEvents = await getUserInvitedEvents(user.id)
    } catch (error) {
      console.error('Error fetching invited events:', error)
    }

    try {
      mediaAssets = await prisma.mediaAsset.findMany({
        where: {
          uploadedById: user.id,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      })
    } catch (error) {
      console.error('Error fetching media assets:', error)
    }

    try {
      interactions = await prisma.interaction.findMany({
        where: {
          userId: user.id,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      })
    } catch (error) {
      console.error('Error fetching interactions:', error)
    }

    try {
      const [eventsCount, inviteesCount, mediaCount, interactionsCount] = await Promise.all([
        prisma.event.count({ where: { ownerId: user.id } }).catch(() => 0),
        prisma.invitee.count({ where: { userId: user.id } }).catch(() => 0),
        prisma.mediaAsset.count({ where: { uploadedById: user.id } }).catch(() => 0),
        prisma.interaction.count({ where: { userId: user.id } }).catch(() => 0),
      ])
      stats = {
        eventsCreated: eventsCount,
        eventsInvited: inviteesCount,
        mediaUploaded: mediaCount,
        interactionsMade: interactionsCount,
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }

    const profileData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      stats,
      createdEvents,
      invitedEvents: (invitedEvents || []).map((invitee: any) => ({
        ...invitee.event,
        rsvpStatus: invitee.rsvpStatus,
      })),
      mediaAssets: mediaAssets.map((asset) => ({
        ...asset,
        createdAt: asset.createdAt.toISOString(),
      })),
      interactions,
    }

    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Profile Header */}
          <UserProfileHeader
            key={profileData.user.image || profileData.user.id} // Force re-render when image changes
            user={profileData.user}
            stats={profileData.stats}
          />

          {/* Stats Overview */}
          <UserStats stats={profileData.stats} />

          {/* Events Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Created Events */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Events I Created</h2>
              <UserEventsList
                events={profileData.createdEvents}
                type="created"
              />
            </Card>

            {/* Invited Events */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Events I'm Invited To</h2>
              <UserEventsList
                events={profileData.invitedEvents}
                type="invited"
              />
            </Card>
          </div>

          {/* Media Section */}
          {profileData.mediaAssets && profileData.mediaAssets.length > 0 && (
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">My Media</h2>
              <UserMediaGrid mediaAssets={profileData.mediaAssets} />
            </Card>
          )}
        </div>
      </DashboardLayout>
    )
  } catch (error: any) {
    console.error('Error loading profile:', error)
    const errorMessage = error?.message || 'Unknown error'
    const errorDetails = process.env.NODE_ENV === 'development' ? errorMessage : undefined
    
    return (
      <DashboardLayout>
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Profile</h1>
          <p className="text-gray-600 mb-2">Failed to load your profile data. Please try again later.</p>
          {errorDetails && (
            <p className="text-sm text-red-600 mt-2">Error: {errorDetails}</p>
          )}
          {error?.code === 'P2021' && (
            <p className="text-sm text-orange-600 mt-2">
              Database migration may be required. Please contact support.
            </p>
          )}
        </Card>
      </DashboardLayout>
    )
  }
}

