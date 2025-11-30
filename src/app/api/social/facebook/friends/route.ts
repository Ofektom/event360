import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Get user's Facebook account
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: 'facebook',
      },
    })

    if (!account || !account.access_token) {
      return NextResponse.json(
        { error: 'Facebook account not linked. Please connect your Facebook account first.' },
        { status: 400 }
      )
    }

    // Fetch friends from Facebook Graph API
    // Note: Facebook requires 'user_friends' permission and app review
    // This will only return friends who also use your app
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/friends?access_token=${account.access_token}&fields=id,name,email,picture.type(large)`,
      {
        method: 'GET',
      }
    )

    if (!response.ok) {
      const error = await response.json()
      
      // Handle specific Facebook API errors
      if (error.error?.code === 200) {
        // Permission not granted
        return NextResponse.json(
          { error: 'Friends permission not granted. Please reconnect your Facebook account with friends permission.' },
          { status: 403 }
        )
      }
      
      throw new Error(error.error?.message || 'Failed to fetch friends')
    }

    const data = await response.json()
    
    // Format friends data
    const friends = data.data?.map((friend: any) => ({
      id: friend.id,
      name: friend.name,
      email: friend.email,
      picture: friend.picture?.data?.url,
      messengerId: friend.id, // Facebook ID can be used for Messenger
    })) || []

    return NextResponse.json({ 
      friends,
      total: friends.length,
      message: friends.length === 0 
        ? 'No friends found. Make sure your friends have also connected with this app.' 
        : undefined
    })
  } catch (error: any) {
    console.error('Error fetching Facebook friends:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch friends' },
      { status: 500 }
    )
  }
}

