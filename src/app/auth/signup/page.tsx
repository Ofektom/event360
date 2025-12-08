import { SignupForm } from '@/components/organisms/SignupForm'
import { OAuthEventJoinHandler } from '@/components/organisms/OAuthEventJoinHandler'

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; eventId?: string }>
}) {
  const params = await searchParams
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <OAuthEventJoinHandler />
      <SignupForm callbackUrl={params.callbackUrl} eventId={params.eventId} />
    </div>
  )
}

