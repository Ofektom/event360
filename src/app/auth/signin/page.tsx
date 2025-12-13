import { LoginForm } from '@/components/organisms/LoginForm'
import { OAuthEventJoinHandler } from '@/components/organisms/OAuthEventJoinHandler'
import { Card } from '@/components/atoms/Card'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; callbackUrl?: string; eventId?: string; redirectToSignup?: string }>
}) {
  const params = await searchParams
  const registered = params.registered === 'true'
  const redirectToSignup = params.redirectToSignup === 'true'

  // Build signup URL with same callback
  const signupUrl = params.callbackUrl 
    ? `/auth/signup?callbackUrl=${encodeURIComponent(params.callbackUrl)}${params.eventId ? `&eventId=${params.eventId}` : ''}`
    : '/auth/signup'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <OAuthEventJoinHandler />
      <div className="w-full max-w-md space-y-4">
        {/* Brand Name */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-purple-600">gbedoo</h1>
        </div>
        
        {registered && (
          <Card className="p-4 bg-green-50 border-green-200">
            <p className="text-sm text-green-800">
              Account created successfully! Please sign in to continue.
            </p>
          </Card>
        )}
        {redirectToSignup && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800 mb-2">
              Please sign in to view this event, or create a new account.
            </p>
            <a 
              href={signupUrl}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Create a new account →
            </a>
          </Card>
        )}
        <LoginForm callbackUrl={params.callbackUrl} eventId={params.eventId} />
        <div className="text-center">
          <p className="text-sm text-gray-700 sm:text-gray-600">
            Don't have an account?{' '}
            <a 
              href={signupUrl}
              className="text-purple-600 hover:text-purple-800 font-semibold sm:font-medium"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

