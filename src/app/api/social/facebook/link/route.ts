import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * This route initiates Facebook OAuth linking
 * The actual linking happens in the OAuth callback via NextAuth
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Check if user already has Facebook account linked
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: 'facebook',
      },
    })

    if (existingAccount) {
      return NextResponse.json(
        { linked: true, message: 'Facebook account already linked' }
      )
    }

    if (!process.env.FACEBOOK_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Facebook OAuth not configured' },
        { status: 500 }
      )
    }

    // Generate Facebook OAuth URL with state parameter for linking
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/auth/callback/facebook`
    
    // Create state parameter with linking info
    const eventId = request.nextUrl.searchParams.get('eventId') || ''
    const state = Buffer.from(JSON.stringify({ 
      link: true, 
      userId: user.id,
      redirect: eventId ? `/events/${eventId}/send-invitations` : '/dashboard'
    })).toString('base64')
    
    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${process.env.FACEBOOK_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=public_profile,email,user_friends&` +
      `response_type=code&` +
      `state=${state}`

    return NextResponse.json({ 
      authUrl: facebookAuthUrl,
      message: 'Redirect to this URL to link Facebook account'
    })
  } catch (error: any) {
    console.error('Error generating Facebook link URL:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate Facebook link URL' },
      { status: 500 }
    )
  }
}

