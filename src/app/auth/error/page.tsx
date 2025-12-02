import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import Link from 'next/link'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params.error

  const errorMessages: Record<string, string> = {
    CredentialsSignin: 'Invalid email or password. Please try again.',
    OAuthAccountNotLinked: 'An account with this email already exists. The account has been automatically linked. Please try signing in again.',
    Configuration: 'There is a problem with the server configuration. This usually means AUTH_SECRET (or NEXTAUTH_SECRET) or AUTH_URL (or NEXTAUTH_URL) is missing, or the deployment needs to be redeployed after adding environment variables. Please check your Vercel project settings and redeploy.',
    AccessDenied: 'Access denied. Please contact support.',
    Verification: 'The verification token has expired or has already been used.',
    Default: 'An error occurred during authentication. Please try again.',
  }

  const errorMessage = errorMessages[error || 'Default'] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md mx-auto">
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <Link href="/auth/signin">
            <Button variant="primary">Back to Sign In</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

