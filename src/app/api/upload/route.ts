import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'

// POST /api/upload - Upload media files
// Uploads files to Cloudinary for production use, with fallback to local storage for development

export async function POST(request: NextRequest) {
  try {
    await requireAuth() // Ensure user is authenticated

    const formData = await request.formData()
    const file = formData.get('file') as File
    const eventId = formData.get('eventId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Get upload type from form data (defaults to 'media' for backward compatibility)
    const uploadType = formData.get('type') as string || 'media'

    // Validate file type based on upload type
    if (uploadType === 'invitation') {
      // For invitations, allow images and PDFs
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only PNG, JPG, and PDF files are allowed for invitations.' },
          { status: 400 }
        )
      }
    } else {
      // For media uploads, allow images and videos
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        return NextResponse.json(
          { error: 'Invalid file type. Only images and videos are allowed.' },
          { status: 400 }
        )
      }
    }

    // Validate file size based on upload type
    const maxSize = uploadType === 'invitation' 
      ? 10 * 1024 * 1024 // 10MB for invitations
      : 50 * 1024 * 1024 // 50MB for media
    const maxSizeLabel = uploadType === 'invitation' ? '10MB' : '50MB'
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${maxSizeLabel}` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${sanitizedName}`
    
    // Cloudinary is required - no fallbacks
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Please configure Cloudinary to upload media files.' },
        { status: 500 }
      )
    }
    
    let fileUrl: string
    let thumbnailUrl: string

    try {
      console.log(`☁️ [CLOUDINARY] Uploading file to Cloudinary...`)
      console.log(`☁️ [CLOUDINARY] Cloud name: ${process.env.CLOUDINARY_CLOUD_NAME || 'from CLOUDINARY_URL'}`)
      
      // Determine resource type
      const resourceType = file.type.startsWith('video/') 
        ? 'video' as const
        : file.type.startsWith('image/')
        ? 'image' as const
        : 'auto' as const

      // Upload to Cloudinary with folder structure: event360/{uploadType}/{eventId}
      const uploadType = formData.get('type') as string || 'media'
      const folder = `event360/${uploadType}/${eventId}`
      
      const result = await uploadToCloudinary(buffer, {
        folder,
        resourceType,
        publicId: `${timestamp}-${sanitizedName.replace(/\.[^/.]+$/, '')}`, // Remove extension for public_id
        overwrite: false,
      })

      fileUrl = result.secureUrl // Use secure URL (HTTPS)
      
      // For videos, generate thumbnail URL using Cloudinary transformation
      if (file.type.startsWith('video/')) {
        // Cloudinary auto-generates video thumbnails
        // Use transformation to get thumbnail: replace video extension with .jpg and add transformation
        // Format: https://res.cloudinary.com/cloud_name/video/upload/w_400,h_300,c_fill/v1/folder/public_id.jpg
        const urlParts = result.secureUrl.split('/upload/')
        if (urlParts.length === 2) {
          // Extract version and path
          const pathParts = urlParts[1].split('/')
          const version = pathParts[0] // e.g., "v1234567890"
          const filePath = pathParts.slice(1).join('/') // rest of the path
          const filePathWithoutExt = filePath.replace(/\.(mp4|mov|avi|webm|webp|mkv|flv)$/i, '')
          thumbnailUrl = `${urlParts[0]}/upload/w_400,h_300,c_fill/${version}/${filePathWithoutExt}.jpg`
        } else {
          // Fallback: simple replacement
          thumbnailUrl = result.secureUrl.replace(/\.(mp4|mov|avi|webm|webp|mkv|flv)$/i, '.jpg')
        }
      } else {
        thumbnailUrl = result.secureUrl
      }
      
      console.log(`✅ [CLOUDINARY] File uploaded successfully: ${fileUrl}`)
      if (thumbnailUrl !== fileUrl) {
        console.log(`✅ [CLOUDINARY] Thumbnail URL: ${thumbnailUrl}`)
      }
    } catch (cloudinaryError: any) {
      console.error('❌ [CLOUDINARY] Upload failed:', cloudinaryError.message)
      return NextResponse.json(
        { error: `Failed to upload file to Cloudinary: ${cloudinaryError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: fileUrl,
      thumbnailUrl: thumbnailUrl,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

