import { NextRequest, NextResponse } from 'next/server'
import { seedInvitationTemplates } from '@/lib/seed-templates'
import { requireAuth } from '@/lib/auth'

// POST /api/invitations/templates/seed - Seed initial templates
export async function POST(request: NextRequest) {
  try {
    // Require authentication (can add admin check later)
    await requireAuth()
    
    await seedInvitationTemplates()
    return NextResponse.json({ 
      message: 'Templates seeded successfully',
      count: '8 templates added/updated'
    })
  } catch (error) {
    console.error('Error seeding templates:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to seed templates' },
      { status: 500 }
    )
  }
}

