import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'

/**
 * POST /api/user/profile/picture
 * Upload profile picture
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type (only images)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only image files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB for profile pictures)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed size of 5MB' },
        { status: 400 }
      )
    }

    // Check Cloudinary configuration
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: 'Image upload service is not configured' },
        { status: 500 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const publicId = `profile-${user.id}-${timestamp}`

    // Upload to Cloudinary with profile picture optimizations
    const result = await uploadToCloudinary(buffer, {
      folder: 'profile-pictures',
      resourceType: 'image',
      publicId,
      overwrite: true, // Allow overwriting previous profile picture
      transformation: [
        {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
          format: 'auto',
        },
      ],
    })

    return NextResponse.json({
      url: result.secureUrl || result.url,
      publicId: result.publicId,
    })
  } catch (error: any) {
    console.error('Error uploading profile picture:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload profile picture' },
      { status: 500 }
    )
  }
}

