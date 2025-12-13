import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { MediaService } from '@/services/media.service'
import { CreateMediaAssetDto, GetMediaFilters } from '@/types/media.types'
import { MediaType, MediaSource } from '@/types/enums'

const mediaService = new MediaService()

// GET /api/events/[eventId]/media - Get all media assets for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const searchParams = request.nextUrl.searchParams
    const ceremonyId = searchParams.get('ceremonyId')
    const isApproved = searchParams.get('isApproved')
    const isFeatured = searchParams.get('isFeatured')
    const type = searchParams.get('type')

    const filters: GetMediaFilters = {}
    if (ceremonyId) filters.ceremonyId = ceremonyId
    if (isApproved !== null) filters.isApproved = isApproved === 'true'
    if (isFeatured !== null) filters.isFeatured = isFeatured === 'true'
    if (type) filters.type = type as MediaType

    const mediaAssets = await mediaService.getMediaByEventId(eventId, filters)
    return NextResponse.json(mediaAssets)
  } catch (error) {
    console.error('Error fetching media assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media assets' },
      { status: 500 }
    )
  }
}

// POST /api/events/[eventId]/media - Create a media asset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth() // Ensure user is authenticated
    const { eventId } = await params
    const body = await request.json()
    
    // Use authenticated user's ID if uploadedById is not provided
    const uploadedById = body.uploadedById || user.id
    const mediaData: CreateMediaAssetDto = {
      ceremonyId: body.ceremonyId,
      uploadedById: uploadedById,
      type: body.type as MediaType,
      url: body.url,
      thumbnailUrl: body.thumbnailUrl,
      filename: body.filename,
      mimeType: body.mimeType,
      size: body.size,
      width: body.width,
      height: body.height,
      duration: body.duration,
      caption: body.caption,
      tags: body.tags,
      source: body.source as MediaSource,
      sourceUrl: body.sourceUrl,
      socialMediaId: body.socialMediaId,
      socialPlatform: body.socialPlatform,
    }

    const mediaAsset = await mediaService.createMediaAsset(eventId, mediaData)
    return NextResponse.json(mediaAsset, { status: 201 })
  } catch (error: any) {
    console.error('Error creating media asset:', error)
    
    if (error.message.includes('required') || error.message.includes('exceeds')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create media asset' },
      { status: 500 }
    )
  }
}

