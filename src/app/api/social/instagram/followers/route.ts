import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Get user's Facebook account (Instagram uses Facebook Graph API)
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: 'facebook',
      },
    })

    if (!account || !account.access_token) {
      return NextResponse.json(
        { error: 'Facebook/Instagram account not linked. Please sign in with Facebook.' },
        { status: 400 }
      )
    }

    // Get Facebook Pages (Instagram Business accounts are linked to Facebook Pages)
    const pageResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${account.access_token}&fields=id,name,instagram_business_account`,
    )

    if (!pageResponse.ok) {
      const error = await pageResponse.json()
      throw new Error(error.error?.message || 'Failed to fetch Facebook pages')
    }

    const pagesData = await pageResponse.json()
    const pages = pagesData.data || []

    if (pages.length === 0) {
      return NextResponse.json(
        { 
          followers: [],
          message: 'No Facebook Pages found. Instagram Business accounts must be connected to a Facebook Page.' 
        }
      )
    }

    // Find page with Instagram Business Account
    let instagramAccountId: string | null = null
    for (const page of pages) {
      if (page.instagram_business_account?.id) {
        instagramAccountId = page.instagram_business_account.id
        break
      }
    }

    if (!instagramAccountId) {
      return NextResponse.json(
        { 
          followers: [],
          message: 'No Instagram Business Account found. Please connect your Instagram Business account to a Facebook Page.' 
        }
      )
    }

    // Note: Instagram Graph API has strict requirements:
    // - Must be a Business or Creator account
    // - Must be connected to a Facebook Page
    // - Requires 'instagram_basic' and 'pages_read_engagement' permissions
    // - Getting followers list requires additional permissions and may not be available
    
    // For now, return a message that this feature requires additional setup
    return NextResponse.json({ 
      followers: [],
      instagramAccountId,
      message: 'Instagram followers integration requires additional API permissions and app review. Contact info can be added manually.' 
    })
  } catch (error: any) {
    console.error('Error fetching Instagram followers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch followers' },
      { status: 500 }
    )
  }
}

