/**
 * Seed Invitation Templates Script
 * 
 * This script seeds the database with initial invitation templates.
 * Run this ONCE during development setup or deployment.
 * 
 * Usage:
 *   pnpm seed:templates
 *   or
 *   npx tsx scripts/seed-templates.ts
 */

import { seedInvitationTemplates } from '../src/lib/seed-templates'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🌱 Seeding invitation templates...')
  console.log('   This will add default templates to the database.')
  console.log('')
  
  try {
    // Check if templates already exist
    const existingCount = await prisma.invitationTemplate.count()
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing template(s) in database.`)
      console.log('   Templates will be updated if they exist, or added if new.')
      console.log('')
    }
    
    // Seed templates
    await seedInvitationTemplates()
    
    // Count final templates
    const finalCount = await prisma.invitationTemplate.count()
    
    console.log('')
    console.log('✅ Templates seeded successfully!')
    console.log(`   Total templates in database: ${finalCount}`)
    console.log('')
    console.log('   Templates are now available to all users.')
    console.log('   Users can select templates, customize them, or upload their own.')
  } catch (error) {
    console.error('')
    console.error('❌ Error seeding templates:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('')
    console.error('Failed to seed templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

