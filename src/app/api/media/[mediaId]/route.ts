import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { MediaService } from '@/services/media.service'
import { prisma } from '@/lib/prisma'

const mediaService = new MediaService()

// DELETE /api/media/[mediaId] - Delete a media asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const user = await requireAuth()
    const { mediaId } = await params

    // Get the media asset to check ownership
    const media = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
      include: {
        event: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!media) {
      return NextResponse.json(
        { error: 'Media asset not found' },
        { status: 404 }
      )
    }

    // Check if user is the event owner or the uploader
    const isEventOwner = media.event.ownerId === user.id
    const isUploader = media.uploadedById === user.id

    if (!isEventOwner && !isUploader) {
      return NextResponse.json(
        { error: 'Unauthorized. Only event owners and uploaders can delete media.' },
        { status: 403 }
      )
    }

    // Delete the media asset (this will also delete from Cloudinary)
    await mediaService.deleteMediaAsset(mediaId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting media asset:', error)
    
    if (error.message === 'Media asset not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete media asset' },
      { status: 500 }
    )
  }
}

