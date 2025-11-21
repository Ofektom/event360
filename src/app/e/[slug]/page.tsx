import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PublicEventLayout } from '@/components/templates/PublicEventLayout'
import { EventHeader } from '@/components/organisms/EventHeader'
import { ProgrammeList } from '@/components/organisms/ProgrammeList'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { EventPhotoGallery } from '@/components/organisms/EventPhotoGallery'
import { EventTimeline } from '@/components/organisms/EventTimeline'
import { JoinEventBanner } from '@/components/organisms/JoinEventBanner'
import { RequestAccessBanner } from '@/components/organisms/RequestAccessBanner'
import { EventService } from '@/services/event.service'
import { canAccessEvent } from '@/lib/access-control'
import { ThemeConfig, defaultTheme } from '@/types/theme.types'

const eventService = new EventService()

interface PublicEventPageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicEventPage({ params }: PublicEventPageProps) {
  const { slug } = await params
  const user = await getCurrentUser()

  try {
    // Get event by slug
    const event = await eventService.getEventBySlug(slug)

    // Check access
    const access = await canAccessEvent(user?.id || null, event.id)

    if (!access.canView) {
      return (
        <PublicEventLayout>
          <div className="container mx-auto px-4 py-12">
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
              <p className="text-gray-600">This event is not available or has been removed.</p>
            </Card>
          </div>
        </PublicEventLayout>
      )
    }

    // Convert ceremonies to ProgrammeList format
    const programmeItems = event.ceremonies.map((ceremony) => ({
      id: ceremony.id,
      title: ceremony.name,
      description: ceremony.description || undefined,
      startTime: new Date(ceremony.date),
      endTime: ceremony.endTime ? new Date(ceremony.endTime) : undefined,
      location: ceremony.location || ceremony.venue || undefined,
      order: ceremony.order,
    }))

    // Get theme colors if available and merge with default theme
    const themeColors = event.customTheme
      ? (event.customTheme as any)?.colors
      : event.theme
      ? (event.theme.config as any)?.colors
      : undefined

    // Merge theme colors with default theme if colors are available
    const theme: ThemeConfig | undefined = themeColors
      ? {
          ...defaultTheme,
          colors: {
            primary: themeColors.primary || defaultTheme.colors.primary,
            secondary: themeColors.secondary || defaultTheme.colors.secondary,
            background: themeColors.background || defaultTheme.colors.background,
            text: themeColors.text || defaultTheme.colors.text,
            accent: themeColors.accent || defaultTheme.colors.accent,
          },
        }
      : undefined

    return (
      <PublicEventLayout theme={theme}>
        <div className="space-y-8">
          {/* Event Header */}
          <EventHeader
            title={event.title}
            description={event.description || undefined}
            startDate={event.startDate ? new Date(event.startDate) : undefined}
            endDate={event.endDate ? new Date(event.endDate) : undefined}
            location={event.location || undefined}
            theme={themeColors}
          />

          {/* Join Event Banner (for unauthenticated users) */}
          {!user && <JoinEventBanner eventSlug={slug} />}

          {/* Request Access Banner (for authenticated but not linked users) */}
          {user && !access.canInteract && !access.isOrganizer && (
            <RequestAccessBanner eventId={event.id} />
          )}

          {/* Programme/Order of Events - Always visible */}
          <div className="container mx-auto px-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Order of Events</h2>
              {programmeItems.length > 0 ? (
                <ProgrammeList items={programmeItems} variant="timeline" />
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Programme details will be available soon.
                </p>
              )}
            </Card>
          </div>

          {/* Full Access Content (only for authenticated, linked users) */}
          {access.canInteract && (
            <>
              {/* Timeline */}
              <div className="container mx-auto px-4">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Timeline</h2>
                  <EventTimeline eventId={event.id} />
                </Card>
              </div>

              {/* Photo Gallery */}
              <div className="container mx-auto px-4">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Photo Gallery</h2>
                  <EventPhotoGallery eventId={event.id} />
                </Card>
              </div>
            </>
          )}
        </div>
      </PublicEventLayout>
    )
  } catch (error: any) {
    console.error('Error loading public event:', error)
    return (
      <PublicEventLayout>
        <div className="container mx-auto px-4 py-12">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="text-gray-600">This event could not be loaded.</p>
          </Card>
        </div>
      </PublicEventLayout>
    )
  }
}


