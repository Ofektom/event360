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
    const [createdEvents, invitedEvents, mediaAssets, interactions, stats] = await Promise.all([
      // Fetch events where user is owner (using userId foreign key)
      prisma.event.findMany({
        where: { ownerId: user.id }, // userId is the foreign key in Event
        include: {
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
      }).catch(() => {
        // If ceremonies orderBy fails, try without it
        return prisma.event.findMany({
          where: { ownerId: user.id },
          include: {
            theme: true,
            ceremonies: true,
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
      }),
      getUserInvitedEvents(user.id),
      prisma.mediaAsset.findMany({
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
      }),
      prisma.interaction.findMany({
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
      }),
      Promise.all([
        prisma.event.count({ where: { ownerId: user.id } }),
        prisma.invitee.count({ where: { userId: user.id } }),
        prisma.mediaAsset.count({ where: { uploadedById: user.id } }),
        prisma.interaction.count({ where: { userId: user.id } }),
      ]),
    ])

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
      stats: {
        eventsCreated: stats[0],
        eventsInvited: stats[1],
        mediaUploaded: stats[2],
        interactionsMade: stats[3],
      },
      createdEvents,
      invitedEvents: invitedEvents.map((invitee: any) => ({
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
            user={profileData.user}
            stats={profileData.stats}
          />

          {/* Stats Overview */}
          <UserStats stats={profileData.stats} />

          {/* Events Section */}
          <div className="grid lg:grid-cols-2 gap-6">
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
  } catch (error) {
    console.error('Error loading profile:', error)
    return (
      <DashboardLayout>
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Profile</h1>
          <p className="text-gray-600">Failed to load your profile data. Please try again later.</p>
        </Card>
      </DashboardLayout>
    )
  }
}

