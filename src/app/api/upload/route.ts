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
    
    let fileUrl: string
    let thumbnailUrl: string

    // Try Cloudinary first if configured
    if (isCloudinaryConfigured()) {
      try {
        console.log(`☁️ [CLOUDINARY] Cloudinary configured - Uploading file to Cloudinary...`)
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
        thumbnailUrl = file.type.startsWith('image/') 
          ? result.secureUrl 
          : result.secureUrl.replace(/\.(mp4|mov|avi|webm)$/i, '.jpg') // Video thumbnail (Cloudinary auto-generates)
        
        console.log(`✅ [CLOUDINARY] File uploaded successfully: ${fileUrl}`)
      } catch (cloudinaryError: any) {
        console.error('❌ [CLOUDINARY] Upload failed:', cloudinaryError.message)
        // Fall back to local storage or base64
        console.log('⚠️ [CLOUDINARY] Falling back to local storage...')
        
        // Continue to fallback logic below
        const isVercel = process.env.VERCEL === '1'
        
        if (isVercel) {
          // On Vercel without Cloudinary: Convert to base64 data URL (not ideal, but works)
          const base64 = buffer.toString('base64')
          fileUrl = `data:${file.type};base64,${base64}`
          thumbnailUrl = file.type.startsWith('image/') ? fileUrl : `/thumbnails/${eventId}/${filename}.jpg`
          console.log(`⚠️ [VERCEL] Using base64 data URL (size: ${base64.length} chars) - Cloudinary upload failed`)
        } else {
          // Local dev: Try to save to filesystem
          try {
            const fs = await import('fs/promises')
            const path = await import('path')
            
            // Create uploads directory if it doesn't exist
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', eventId)
            try {
              await fs.mkdir(uploadsDir, { recursive: true })
            } catch (error) {
              // Directory might already exist, that's fine
            }

            const filePath = path.join(uploadsDir, filename)
            await fs.writeFile(filePath, buffer)

            // Generate public URL - files in public folder are served directly
            fileUrl = `/uploads/${eventId}/${filename}`
            thumbnailUrl = file.type.startsWith('image/') ? fileUrl : `/thumbnails/${eventId}/${filename}.jpg`
            
            console.log(`✅ [LOCAL] File saved to filesystem: ${filePath}`)
            console.log(`✅ [LOCAL] Public URL: ${fileUrl}`)
          } catch (fsError: any) {
            // Fallback to base64 if filesystem write fails
            console.warn('⚠️ Filesystem write failed, using base64:', fsError.message)
            const base64 = buffer.toString('base64')
            fileUrl = `data:${file.type};base64,${base64}`
            thumbnailUrl = file.type.startsWith('image/') ? fileUrl : `/thumbnails/${eventId}/${filename}.jpg`
            console.log(`✅ Using base64 data URL (size: ${base64.length} chars)`)
          }
        }
      }
    } else {
      // Cloudinary not configured - use local storage or base64
      console.log('⚠️ [CLOUDINARY] Not configured, using local storage or base64')
      const isVercel = process.env.VERCEL === '1'
      
      if (isVercel) {
        // On Vercel: Convert to base64 data URL
        const base64 = buffer.toString('base64')
        fileUrl = `data:${file.type};base64,${base64}`
        thumbnailUrl = file.type.startsWith('image/') ? fileUrl : `/thumbnails/${eventId}/${filename}.jpg`
        console.log(`⚠️ [VERCEL] Using base64 data URL (size: ${base64.length} chars) - Cloudinary not configured`)
        console.log(`⚠️ [VERCEL] Please configure Cloudinary for production use`)
      } else {
        // Local dev: Try to save to filesystem
        try {
          const fs = await import('fs/promises')
          const path = await import('path')
          
          // Create uploads directory if it doesn't exist
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads', eventId)
          try {
            await fs.mkdir(uploadsDir, { recursive: true })
          } catch (error) {
            // Directory might already exist, that's fine
          }

          const filePath = path.join(uploadsDir, filename)
          await fs.writeFile(filePath, buffer)

          // Generate public URL - files in public folder are served directly
          fileUrl = `/uploads/${eventId}/${filename}`
          thumbnailUrl = file.type.startsWith('image/') ? fileUrl : `/thumbnails/${eventId}/${filename}.jpg`
          
          console.log(`✅ [LOCAL] File saved to filesystem: ${filePath}`)
          console.log(`✅ [LOCAL] Public URL: ${fileUrl}`)
        } catch (fsError: any) {
          // Fallback to base64 if filesystem write fails
          console.warn('⚠️ Filesystem write failed, using base64:', fsError.message)
          const base64 = buffer.toString('base64')
          fileUrl = `data:${file.type};base64,${base64}`
          thumbnailUrl = file.type.startsWith('image/') ? fileUrl : `/thumbnails/${eventId}/${filename}.jpg`
          console.log(`✅ Using base64 data URL (size: ${base64.length} chars)`)
        }
      }
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

