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
      <div className="w-full max-w-md space-y-4">
        {/* Brand Name */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-purple-600">gbedoo</h1>
        </div>
        <SignupForm callbackUrl={params.callbackUrl} eventId={params.eventId} />
      </div>
    </div>
  )
}

