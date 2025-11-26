import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/shapes - Get all shapes and symbols
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive') !== 'false'

    const where: any = {}
    if (category && category !== 'all') {
      where.category = category
    }
    if (type && type !== 'all') {
      where.type = type
    }
    if (isActive) {
      where.isActive = true
    }

    const shapes = await prisma.designShape.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        svgPath: true,
        defaultColor: true,
      },
    })

    return NextResponse.json(shapes)
  } catch (error) {
    console.error('Error fetching shapes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shapes' },
      { status: 500 }
    )
  }
}

