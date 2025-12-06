import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/events/[eventId]/like - Check if user has liked the event and get like count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId } = await params

    // Check if user has liked this event
    const userLike = await prisma.interaction.findFirst({
      where: {
        eventId,
        userId: user.id,
        type: 'REACTION',
        reaction: 'LIKE',
      },
    })

    // Get total like count
    const likeCount = await prisma.interaction.count({
      where: {
        eventId,
        type: 'REACTION',
        reaction: 'LIKE',
        isApproved: true,
      },
    })

    // Get comment count
    const commentCount = await prisma.interaction.count({
      where: {
        eventId,
        type: 'COMMENT',
        isApproved: true,
      },
    })

    return NextResponse.json({
      hasLiked: !!userLike,
      likeCount,
      commentCount,
    })
  } catch (error: any) {
    console.error('Error fetching like status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch like status' },
      { status: 500 }
    )
  }
}

// POST /api/events/[eventId]/like - Toggle like (like/unlike)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId } = await params

    // Check if user has already liked this event
    const existingLike = await prisma.interaction.findFirst({
      where: {
        eventId,
        userId: user.id,
        type: 'REACTION',
        reaction: 'LIKE',
      },
    })

    if (existingLike) {
      // Unlike: Delete the reaction
      await prisma.interaction.delete({
        where: { id: existingLike.id },
      })
    } else {
      // Like: Create a new reaction
      await prisma.interaction.create({
        data: {
          eventId,
          userId: user.id,
          type: 'REACTION',
          reaction: 'LIKE',
          isApproved: true,
        },
      })
    }

    // Get updated counts
    const likeCount = await prisma.interaction.count({
      where: {
        eventId,
        type: 'REACTION',
        reaction: 'LIKE',
        isApproved: true,
      },
    })

    const commentCount = await prisma.interaction.count({
      where: {
        eventId,
        type: 'COMMENT',
        isApproved: true,
      },
    })

    return NextResponse.json({
      hasLiked: !existingLike,
      likeCount,
      commentCount,
    })
  } catch (error: any) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}

