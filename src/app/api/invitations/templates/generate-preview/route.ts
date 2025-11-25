import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUnsplashQueryForCategory, getUnsplashImageUrl } from '@/lib/template-renderer'

/**
 * POST /api/invitations/templates/generate-preview
 * Generate preview image for a template
 * 
 * This endpoint can be used to:
 * 1. Generate previews for existing templates without preview images
 * 2. Regenerate previews when template config changes
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const { templateId, useUnsplash } = body

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Get template
    const template = await prisma.invitationTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Generate preview URL
    let previewUrl: string | null = null

    if (useUnsplash) {
      // Use Unsplash for preview image
      const query = getUnsplashQueryForCategory(template.category)
      previewUrl = getUnsplashImageUrl(query, 400, 500)
    } else {
      // For now, return a placeholder
      // In production, you would render the template and generate an image
      // This requires server-side rendering (Puppeteer) or client-side rendering
      previewUrl = null
    }

    // Update template with preview URL
    if (previewUrl) {
      await prisma.invitationTemplate.update({
        where: { id: templateId },
        data: { preview: previewUrl },
      })
    }

    return NextResponse.json({
      templateId,
      previewUrl,
      message: previewUrl ? 'Preview generated successfully' : 'Preview generation pending',
    })
  } catch (error) {
    console.error('Error generating template preview:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}

