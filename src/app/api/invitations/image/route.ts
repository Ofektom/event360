import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/invitations/image?data=<encoded_data_url>
 * Serves invitation images from data URLs
 * This is a workaround for Vercel which doesn't support filesystem storage
 * In production, you should use a proper storage service (S3, Cloudinary, Vercel Blob)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const encodedDataUrl = searchParams.get('data')

    if (!encodedDataUrl) {
      return NextResponse.json(
        { error: 'Data parameter is required' },
        { status: 400 }
      )
    }

    // Decode the data URL
    const dataUrl = decodeURIComponent(encodedDataUrl)

    if (!dataUrl.startsWith('data:')) {
      return NextResponse.json(
        { error: 'Invalid data URL format' },
        { status: 400 }
      )
    }

    // Extract MIME type and base64 data
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid data URL format' },
        { status: 400 }
      )
    }

    const mimeType = matches[1] || 'image/png'
    const base64Data = matches[2]

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')

    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    })
  } catch (error: any) {
    console.error('Error serving invitation image:', error)
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    )
  }
}

