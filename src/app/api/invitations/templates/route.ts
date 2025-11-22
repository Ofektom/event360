import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/invitations/templates - Get all invitation templates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive') !== 'false'

    const where: any = {}
    if (category && category !== 'all') {
      where.category = category
    }
    if (isActive) {
      where.isActive = true
    }

    const templates = await prisma.invitationTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        preview: true,
        isDefault: true,
      },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching invitation templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

