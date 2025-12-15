import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PublicEventLayout } from "@/components/templates/PublicEventLayout";
import { EventHeader } from "@/components/organisms/EventHeader";
import { ProgrammeList } from "@/components/organisms/ProgrammeList";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { EventPhotoGallery } from "@/components/organisms/EventPhotoGallery";
import { JoinEventBanner } from "@/components/organisms/JoinEventBanner";
import { RequestAccessBanner } from "@/components/organisms/RequestAccessBanner";
import { OAuthEventJoinHandler } from "@/components/organisms/OAuthEventJoinHandler";
import { EventService } from "@/services/event.service";
import { canAccessEvent, canAccessCeremony } from "@/lib/access-control";
import { ThemeConfig, defaultTheme } from "@/types/theme.types";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BackButton } from "@/components/shared/BackButton";

const eventService = new EventService();

// This page uses getCurrentUser() which accesses headers, so it must be dynamic
export const dynamic = "force-dynamic";

interface PublicEventPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicEventPage({
  params,
}: PublicEventPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();

  // If user is not authenticated, redirect to signin with callback to signup
  // This allows users to either login or signup
  if (!user) {
    redirect(`/auth/signin?callbackUrl=/e/${slug}&redirectToSignup=true`);
  }

  try {
    // Get event by slug
    const event = await eventService.getEventBySlug(slug);

    // Check access
    const access = await canAccessEvent(user.id, event.id);

    // If user is authenticated but not linked to event, automatically add them as guest
    if (!access.canInteract && !access.isOrganizer) {
      // This will be handled client-side to avoid blocking the page load
      // The RequestAccessBanner will handle the join automatically
    }

    if (!access.canView) {
      return (
        <PublicEventLayout>
          <div className="container mx-auto px-4 py-12">
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
              <p className="text-gray-600">
                This event is not available or has been removed.
              </p>
            </Card>
          </div>
        </PublicEventLayout>
      );
    }

    // Filter ceremonies based on visibility and user access
    const ceremonyAccessChecks = await Promise.all(
      event.ceremonies.map(async (ceremony) => {
        const canAccess = await canAccessCeremony(user.id, ceremony.id);
        return { ceremony, canAccess };
      })
    );
    const visibleCeremonies = ceremonyAccessChecks
      .filter(({ canAccess }) => canAccess)
      .map(({ ceremony }) => ceremony);

    // Convert ceremonies to ProgrammeList format (these are ceremonies, not schedule items)
    const programmeItems = visibleCeremonies.map((ceremony) => ({
      id: ceremony.id,
      title: ceremony.name,
      description: ceremony.description || undefined,
      startTime: new Date(ceremony.date),
      endTime: ceremony.endTime ? new Date(ceremony.endTime) : undefined,
      location: ceremony.location || ceremony.venue || undefined,
      order: ceremony.order,
    }));

    // Get theme colors if available and merge with default theme
    const themeColors = event.customTheme
      ? (event.customTheme as any)?.colors
      : event.theme
      ? (event.theme.config as any)?.colors
      : undefined;

    // Merge theme colors with default theme if colors are available
    const theme: ThemeConfig | undefined = themeColors
      ? {
          ...defaultTheme,
          colors: {
            primary: themeColors.primary || defaultTheme.colors.primary,
            secondary: themeColors.secondary || defaultTheme.colors.secondary,
            background:
              themeColors.background || defaultTheme.colors.background,
            text: themeColors.text || defaultTheme.colors.text,
            accent: themeColors.accent || defaultTheme.colors.accent,
          },
        }
      : undefined;

    // Fetch invitation designs (public - anyone can see)
    const invitationDesigns = await prisma.invitationDesign
      .findMany({
        where: {
          eventId: event.id,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          isDefault: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6, // Show first 6 designs
      })
      .catch(() => []);

    return (
      <PublicEventLayout theme={theme}>
        <OAuthEventJoinHandler />
        <div className="space-y-8">
          {/* Back Button */}
          <div className="container mx-auto px-4 pt-8">
            <BackButton href="/timeline" label="Back to Timeline" />
          </div>
          {/* Event Header */}
          <EventHeader
            title={event.title}
            description={event.description || undefined}
            startDate={event.startDate ? new Date(event.startDate) : undefined}
            endDate={event.endDate ? new Date(event.endDate) : undefined}
            location={event.location || undefined}
            theme={themeColors}
          />

          {/* Request Access Banner (for authenticated but not linked users) */}
          {!access.canInteract && !access.isOrganizer && (
            <RequestAccessBanner eventId={event.id} eventSlug={slug} />
          )}

          {/* Ceremonies List - Always visible (filtered by visibility) */}
          {visibleCeremonies.length > 0 ? (
            <div
              id="ceremonies"
              className="container mx-auto px-4 scroll-mt-20"
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Ceremonies
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleCeremonies.map((ceremony) => (
                    <Link
                      key={ceremony.id}
                      href={`/e/${slug}/ceremony/${ceremony.id}`}
                      className="block"
                    >
                      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {ceremony.name}
                        </h3>
                        {ceremony.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {ceremony.description}
                          </p>
                        )}
                        <div className="space-y-1 text-sm text-gray-500">
                          {ceremony.date && (
                            <div>
                              📅 {new Date(ceremony.date).toLocaleDateString()}
                            </div>
                          )}
                          {ceremony.location && (
                            <div>📍 {ceremony.location}</div>
                          )}
                          {ceremony.isStreaming && (
                            <div className="text-red-600 font-semibold">
                              🔴 Live
                            </div>
                          )}
                        </div>
                        <div className="mt-4 text-sm text-purple-600 font-medium">
                          View Details →
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <div className="container mx-auto px-4">
              <Card className="p-6">
                <p className="text-gray-500 text-center py-8">
                  Ceremony details will be available soon.
                </p>
              </Card>
            </div>
          )}

          {/* Invitation Designs Section - Always visible */}
          {invitationDesigns.length > 0 && (
            <div className="container mx-auto px-4">
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Invitation Designs
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {invitationDesigns.map((design) => (
                    <div key={design.id} className="relative">
                      {design.imageUrl ? (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={design.imageUrl}
                            alt={design.name || "Invitation design"}
                            className="w-full h-full object-cover"
                          />
                          {design.isDefault && (
                            <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-48 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <span className="text-4xl">💌</span>
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900 mt-2">
                        {design.name || "Untitled Design"}
                      </h3>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Full Access Content (only for authenticated, linked users) */}
          {access.canInteract && (
            <>
              {/* Media Gallery */}
              <div id="gallery" className="container mx-auto px-4 scroll-mt-20">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Photos & Videos</h2>
                  <EventPhotoGallery eventId={event.id} />
                </Card>
              </div>
            </>
          )}

          {/* Vendors Section */}
          <div id="vendors" className="container mx-auto px-4 scroll-mt-20">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Vendors</h2>
              <p className="text-gray-600 text-center py-8">
                Vendor information will be displayed here.
              </p>
            </Card>
          </div>
        </div>
      </PublicEventLayout>
    );
  } catch (error: any) {
    console.error("Error loading public event:", error);

    // If user is not authenticated and there's an error, redirect to signin
    // This handles cases where the event fetch fails before the redirect happens
    if (!user) {
      redirect(`/auth/signin?callbackUrl=/e/${slug}&redirectToSignup=true`);
    }

    // For authenticated users, show error message
    return (
      <PublicEventLayout>
        <div className="container mx-auto px-4 py-12">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="text-gray-600 mb-4">
              This event could not be loaded.
            </p>
            <p className="text-sm text-gray-500">
              The event may not exist, or you may not have permission to view
              it.
            </p>
          </Card>
        </div>
      </PublicEventLayout>
    );
  }
}
