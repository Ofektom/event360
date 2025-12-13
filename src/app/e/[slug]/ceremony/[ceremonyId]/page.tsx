import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PublicEventLayout } from '@/components/templates/PublicEventLayout'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import { OrderOfEventsList } from '@/components/organisms/OrderOfEventsList'
import { EventVendorsList } from '@/components/organisms/EventVendorsList'
import { EventService } from '@/services/event.service'
import { canAccessEvent, canAccessCeremony } from '@/lib/access-control'
import { ThemeConfig, defaultTheme } from '@/types/theme.types'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BackButton } from '@/components/shared/BackButton'

const eventService = new EventService()

export const dynamic = 'force-dynamic'

interface PublicCeremonyPageProps {
  params: Promise<{ slug: string; ceremonyId: string }>
}

export default async function PublicCeremonyPage({ params }: PublicCeremonyPageProps) {
  const { slug, ceremonyId } = await params
  const user = await getCurrentUser()

  // If user is not authenticated, redirect to signin with callback to signup
  // This allows users to either login or signup
  if (!user) {
    redirect(`/auth/signin?callbackUrl=/e/${slug}/ceremony/${ceremonyId}&redirectToSignup=true`)
  }

  try {
    // Get event by slug
    const eventData = await eventService.getEventBySlug(slug)

    // Check access
    const access = await canAccessEvent(user.id, eventData.id)

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

    // Find the ceremony
    const ceremony = eventData.ceremonies.find((c) => c.id === ceremonyId)

    if (!ceremony) {
      return (
        <PublicEventLayout>
          <div className="container mx-auto px-4 py-12">
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Ceremony Not Found</h1>
              <p className="text-gray-600">This ceremony is not available.</p>
              <Link href={`/e/${slug}`}>
                <Button variant="primary" className="mt-4">
                  ← Back to Event
                </Button>
              </Link>
            </Card>
          </div>
        </PublicEventLayout>
      )
    }

    // Check ceremony access
    const canAccess = await canAccessCeremony(user.id, ceremonyId)

    if (!canAccess) {
      return (
        <PublicEventLayout>
          <div className="container mx-auto px-4 py-12">
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="text-gray-600">You don't have access to view this ceremony.</p>
              <Link href={`/e/${slug}`}>
                <Button variant="primary" className="mt-4">
                  ← Back to Event
                </Button>
              </Link>
            </Card>
          </div>
        </PublicEventLayout>
      )
    }

    // Get theme colors if available
    const themeColors = eventData.customTheme
      ? (eventData.customTheme as any)?.colors
      : eventData.theme
      ? (eventData.theme.config as any)?.colors
      : undefined

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
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Back Button */}
          <div className="mb-4">
            <BackButton href={`/e/${slug}`} label={`Back to ${eventData.title}`} />
          </div>
          
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{ceremony.name}</h1>
            {ceremony.description && (
              <p className="text-gray-600 mt-2">{ceremony.description}</p>
            )}
          </div>

          {/* Ceremony Details */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ceremony Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ceremony.date && (
                <div>
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="font-medium text-gray-900">
                    {new Date(ceremony.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              )}
              {ceremony.startTime && (
                <div>
                  <div className="text-sm text-gray-500">Start Time</div>
                  <div className="font-medium text-gray-900">
                    {new Date(ceremony.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )}
              {ceremony.endTime && (
                <div>
                  <div className="text-sm text-gray-500">End Time</div>
                  <div className="font-medium text-gray-900">
                    {new Date(ceremony.endTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )}
              {ceremony.location && (
                <div>
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-medium text-gray-900">{ceremony.location}</div>
                </div>
              )}
              {ceremony.venue && (
                <div>
                  <div className="text-sm text-gray-500">Venue</div>
                  <div className="font-medium text-gray-900">{ceremony.venue}</div>
                </div>
              )}
              {ceremony.dressCode && (
                <div>
                  <div className="text-sm text-gray-500">Dress Code</div>
                  <div className="font-medium text-gray-900">{ceremony.dressCode}</div>
                </div>
              )}
              {ceremony.isStreaming && ceremony.streamUrl && (
                <div>
                  <div className="text-sm text-gray-500">Live Stream</div>
                  <Link
                    href={`/e/${slug}/live`}
                    className="text-red-600 font-medium hover:underline"
                  >
                    🔴 Watch Live Stream
                  </Link>
                </div>
              )}
            </div>
            {ceremony.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">Notes</div>
                <div className="text-gray-900 mt-1">{ceremony.notes}</div>
              </div>
            )}
          </Card>

          {/* Order of Events */}
          <OrderOfEventsList
            ceremonyId={ceremonyId}
            ceremonyName={ceremony.name}
            isOwner={false}
          />

          {/* Vendors */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Vendors for {ceremony.name}
            </h2>
            <EventVendorsList
              eventId={eventData.id}
              ceremonyId={ceremonyId}
              isOwner={false}
            />
          </Card>
        </div>
      </PublicEventLayout>
    )
  } catch (error: any) {
    console.error('Error loading ceremony:', error)
    
    // If user is not authenticated and there's an error, redirect to signin
    // This handles cases where the event fetch fails before the redirect happens
    if (!user) {
      redirect(`/auth/signin?callbackUrl=/e/${slug}/ceremony/${ceremonyId}&redirectToSignup=true`)
    }
    
    // For authenticated users, show error message
    return (
      <PublicEventLayout>
        <div className="container mx-auto px-4 py-12">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Ceremony Not Found</h1>
            <p className="text-gray-600 mb-4">This ceremony could not be loaded.</p>
            <p className="text-sm text-gray-500 mb-4">
              The ceremony may not exist, or you may not have permission to view it.
            </p>
            <Link href={`/e/${slug}`}>
              <Button variant="primary" className="mt-4">
                ← Back to Event
              </Button>
            </Link>
          </Card>
        </div>
      </PublicEventLayout>
    )
  }
}

