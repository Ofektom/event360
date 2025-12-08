import { LoginForm } from '@/components/organisms/LoginForm'
import { OAuthEventJoinHandler } from '@/components/organisms/OAuthEventJoinHandler'
import { Card } from '@/components/atoms/Card'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; callbackUrl?: string; eventId?: string }>
}) {
  const params = await searchParams
  const registered = params.registered === 'true'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <OAuthEventJoinHandler />
      <div className="w-full max-w-md space-y-4">
        {registered && (
          <Card className="p-4 bg-green-50 border-green-200">
            <p className="text-sm text-green-800">
              Account created successfully! Please sign in to continue.
            </p>
          </Card>
        )}
        <LoginForm callbackUrl={params.callbackUrl} eventId={params.eventId} />
      </div>
    </div>
  )
}

