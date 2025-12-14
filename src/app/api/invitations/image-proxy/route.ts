import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/invitations/image-proxy?url=<encoded_cloudinary_url>
 * Proxies invitation images from Cloudinary through the app's base URL
 * This allows WhatsApp to show the image preview using the app's domain
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Decode the URL
    const decodedUrl = decodeURIComponent(imageUrl)

    // Validate it's a Cloudinary URL or our own domain
    if (!decodedUrl.includes('cloudinary.com') && !decodedUrl.includes('res.cloudinary.com')) {
      return NextResponse.json(
        { error: 'Invalid image URL. Only Cloudinary URLs are supported.' },
        { status: 400 }
      )
    }

    // Fetch the image from Cloudinary
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; gbedoo/1.0)',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      )
    }

    // Get the image buffer
    const imageBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(imageBuffer)

    // Get content type from response or default to image/png
    const contentType = response.headers.get('content-type') || 'image/png'

    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*', // Allow WhatsApp to fetch
      },
    })
  } catch (error: any) {
    console.error('Error proxying invitation image:', error)
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    )
  }
}

