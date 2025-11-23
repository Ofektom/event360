const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Helper to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function checkDatabase() {
  try {
    console.log('=== Database Check ===\n')
    
    // Check events
    const events = await prisma.event.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            ceremonies: true,
            invitees: true,
            mediaAssets: true,
            interactions: true,
          },
        },
      },
    })
    
    console.log(`Found ${events.length} events:\n`)
    events.forEach((event, index) => {
      console.log(`Event ${index + 1}:`)
      console.log(`  ID: ${event.id}`)
      console.log(`  Title: ${event.title}`)
      console.log(`  Type: ${event.type}`)
      console.log(`  Status: ${event.status}`)
      console.log(`  Owner: ${event.owner.email} (${event.owner.name || 'No name'})`)
      console.log(`  Start Date: ${event.startDate || 'Not set'}`)
      console.log(`  Location: ${event.location || 'Not set'}`)
      console.log(`  Slug: ${event.slug || 'Not set'}`)
      // Check if visibility field exists (might not if migration hasn't run)
      try {
        console.log(`  Visibility: ${event.visibility || 'Not set (migration needed)'}`)
      } catch (e) {
        console.log(`  Visibility: Field not in schema (migration needed)`)
      }
      console.log(`  Created: ${event.createdAt}`)
      console.log(`  Counts: ${event._count.ceremonies} ceremonies, ${event._count.invitees} invitees, ${event._count.mediaAssets} media, ${event._count.interactions} interactions`)
      
      // Check for missing required fields
      const issues = []
      if (!event.title) issues.push('Missing title')
      if (!event.type) issues.push('Missing type')
      if (!event.slug) issues.push('Missing slug')
      if (!event.ownerId) issues.push('Missing ownerId')
      
      if (issues.length > 0) {
        console.log(`  ⚠️  Issues: ${issues.join(', ')}`)
      } else {
        console.log(`  ✅ All required fields present`)
      }
      console.log('')
    })
    
    // Check total counts
    const totalEvents = await prisma.event.count()
    const totalUsers = await prisma.user.count()
    const totalInvitees = await prisma.invitee.count()
    const totalMedia = await prisma.mediaAsset.count()
    const totalInteractions = await prisma.interaction.count()
    
    console.log(`\n=== Database Summary ===`)
    console.log(`Total Events: ${totalEvents}`)
    console.log(`Total Users: ${totalUsers}`)
    console.log(`Total Invitees: ${totalInvitees}`)
    console.log(`Total Media Assets: ${totalMedia}`)
    console.log(`Total Interactions: ${totalInteractions}`)
    
    // Check for orphaned records
    console.log(`\n=== Checking for Issues ===`)
    
    // Check events without valid owners (ownerId doesn't match any user)
    const allEvents = await prisma.event.findMany({
      select: { id: true, title: true, ownerId: true },
    })
    
    const allUserIds = new Set(
      (await prisma.user.findMany({ select: { id: true } })).map(u => u.id)
    )
    
    const eventsWithoutOwners = allEvents.filter(e => !allUserIds.has(e.ownerId))
    
    if (eventsWithoutOwners.length > 0) {
      console.log(`⚠️  Found ${eventsWithoutOwners.length} events without valid owners:`)
      eventsWithoutOwners.forEach(e => console.log(`  - ${e.id}: ${e.title} (ownerId: ${e.ownerId})`))
    } else {
      console.log(`✅ All events have valid owners`)
    }
    
    // Check for events with missing or empty slugs
    const allEventsForSlugCheck = await prisma.event.findMany({
      select: { id: true, title: true, slug: true },
    })
    
    const eventsWithoutSlugs = allEventsForSlugCheck.filter(
      e => !e.slug || e.slug.trim() === ''
    )
    
    if (eventsWithoutSlugs.length > 0) {
      console.log(`⚠️  Found ${eventsWithoutSlugs.length} events without slugs:`)
      eventsWithoutSlugs.forEach(e => console.log(`  - ${e.id}: ${e.title}`))
    } else {
      console.log(`✅ All events have slugs`)
    }
    
    // Check for visibility field (if migration hasn't run)
    try {
      const eventsWithoutVisibility = await prisma.$queryRaw`
        SELECT id, title FROM "Event" 
        WHERE "visibility" IS NULL
        LIMIT 10
      `
      if (eventsWithoutVisibility && eventsWithoutVisibility.length > 0) {
        console.log(`⚠️  Found ${eventsWithoutVisibility.length} events without visibility field (migration needed)`)
      } else {
        console.log(`✅ All events have visibility field`)
      }
    } catch (e) {
      console.log(`⚠️  Visibility field may not exist in database (migration needed)`)
    }
    
    console.log(`\n=== Check Complete ===`)
    
    return {
      eventsWithoutSlugs,
      eventsWithoutOwners,
    }
    
  } catch (error) {
    console.error('Error checking database:', error)
    throw error
  }
}

async function fixDataIssues() {
  try {
    console.log('\n=== Fixing Data Issues ===\n')
    
    // Fix missing slugs
    const allEventsForSlugFix = await prisma.event.findMany({
      select: { id: true, title: true, slug: true },
    })
    
    const eventsWithoutSlugs = allEventsForSlugFix.filter(
      e => !e.slug || e.slug.trim() === ''
    )
    
    if (eventsWithoutSlugs.length > 0) {
      console.log(`Fixing ${eventsWithoutSlugs.length} events with missing slugs...`)
      for (const event of eventsWithoutSlugs) {
        const baseSlug = generateSlug(event.title)
        let slug = baseSlug
        let counter = 1
        
        // Ensure slug is unique
        while (await prisma.event.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`
          counter++
        }
        
        await prisma.event.update({
          where: { id: event.id },
          data: { slug },
        })
        console.log(`  ✅ Fixed slug for "${event.title}": ${slug}`)
      }
    } else {
      console.log(`✅ No events with missing slugs`)
    }
    
    // Try to set visibility default (if field exists)
    try {
      const result = await prisma.$executeRaw`
        UPDATE "Event" 
        SET "visibility" = 'INVITED_ONLY' 
        WHERE "visibility" IS NULL
      `
      if (result > 0) {
        console.log(`✅ Set default visibility for ${result} events`)
      }
    } catch (e) {
      console.log(`⚠️  Could not set visibility (field may not exist - run migration first)`)
    }
    
    console.log(`\n=== Fix Complete ===`)
    
  } catch (error) {
    console.error('Error fixing data:', error)
    throw error
  }
}

async function cleanTestData() {
  try {
    console.log('\n=== Cleaning Test Data ===\n')
    console.log('⚠️  WARNING: This will delete test/invalid data!')
    
    // Delete events without valid owners
    const allEvents = await prisma.event.findMany({
      select: { id: true, title: true, ownerId: true },
    })
    
    const allUserIds = new Set(
      (await prisma.user.findMany({ select: { id: true } })).map(u => u.id)
    )
    
    const eventsWithoutOwners = allEvents.filter(e => !allUserIds.has(e.ownerId))
    
    if (eventsWithoutOwners.length > 0) {
      console.log(`Deleting ${eventsWithoutOwners.length} events without valid owners...`)
      for (const event of eventsWithoutOwners) {
        await prisma.event.delete({
          where: { id: event.id },
        })
        console.log(`  ✅ Deleted event: ${event.title} (${event.id})`)
      }
    } else {
      console.log(`✅ No orphaned events to delete`)
    }
    
    // Delete events with missing required fields (title, type, slug)
    const allEventsForValidation = await prisma.event.findMany({
      select: { id: true, title: true, type: true, slug: true },
    })
    
    const invalidEvents = allEventsForValidation.filter(
      e => !e.title || e.title.trim() === '' || !e.type || !e.slug || e.slug.trim() === ''
    )
    
    if (invalidEvents.length > 0) {
      console.log(`\nDeleting ${invalidEvents.length} events with missing required fields...`)
      for (const event of invalidEvents) {
        await prisma.event.delete({
          where: { id: event.id },
        })
        console.log(`  ✅ Deleted invalid event: ${event.title || 'No title'} (${event.id})`)
      }
    } else {
      console.log(`✅ No invalid events to delete`)
    }
    
    console.log(`\n=== Cleanup Complete ===`)
    
  } catch (error) {
    console.error('Error cleaning data:', error)
    throw error
  }
}

async function main() {
  const args = process.argv.slice(2)
  const shouldFix = args.includes('--fix')
  const shouldClean = args.includes('--clean')
  const shouldDelete = args.includes('--delete-all')
  
  if (shouldDelete) {
    console.log('⚠️  WARNING: --delete-all flag detected!')
    console.log('This will delete ALL events from the database!')
    console.log('This action cannot be undone!')
    console.log('\nTo proceed, run: node scripts/check-and-clean-db.js --delete-all --confirm')
    
    if (!args.includes('--confirm')) {
      console.log('\nAborted. Add --confirm flag to proceed.')
      await prisma.$disconnect()
      process.exit(1)
    }
    
    const count = await prisma.event.count()
    console.log(`\nDeleting ${count} events...`)
    await prisma.event.deleteMany({})
    console.log('✅ All events deleted')
    await prisma.$disconnect()
    return
  }
  
  const issues = await checkDatabase()
  
  if (shouldFix) {
    await fixDataIssues()
  }
  
  if (shouldClean) {
    await cleanTestData()
  }
  
  if (!shouldFix && !shouldClean) {
    console.log(`\nNote: This is a read-only check.`)
    console.log(`Use --fix to fix data issues (missing slugs, visibility defaults)`)
    console.log(`Use --clean to delete test/invalid data`)
    console.log(`Use --delete-all --confirm to delete ALL events (DANGEROUS!)`)
  }
  
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

