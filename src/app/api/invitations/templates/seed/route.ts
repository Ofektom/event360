import { NextRequest, NextResponse } from 'next/server'
import { seedInvitationTemplates } from '@/lib/seed-templates'

// POST /api/invitations/templates/seed - Seed initial templates (admin only)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin check
    await seedInvitationTemplates()
    return NextResponse.json({ message: 'Templates seeded successfully' })
  } catch (error) {
    console.error('Error seeding templates:', error)
    return NextResponse.json(
      { error: 'Failed to seed templates' },
      { status: 500 }
    )
  }
}

