import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * Serve uploaded files from public/uploads directory
 * Route: /api/uploads/[eventId]/[filename]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params
    const filePath = pathArray.join('/')
    
    // Security: Only allow files from uploads directory
    if (!filePath.startsWith('uploads/')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      )
    }

    // Construct full file path
    const fullPath = join(process.cwd(), 'public', filePath)
    
    // Check if file exists
    if (!existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`)
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(fullPath)
    
    // Determine content type from file extension
    const ext = filePath.split('.').pop()?.toLowerCase()
    const contentType = ext === 'png' ? 'image/png' 
      : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
      : ext === 'pdf' ? 'application/pdf'
      : 'application/octet-stream'

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}

