import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Check if the current user has a Facebook account linked
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Check if user has Facebook account linked
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: 'facebook',
      },
      select: {
        id: true,
        provider: true,
      },
    })

    return NextResponse.json({ 
      linked: !!account,
      provider: account?.provider || null,
    })
  } catch (error: any) {
    console.error('Error checking Facebook account:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: error.message || 'Failed to check Facebook account' },
      { status: 500 }
    )
  }
}

