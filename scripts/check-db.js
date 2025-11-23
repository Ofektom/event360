const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('Checking database...\n')
    
    // Check events
    const events = await prisma.event.findMany({
      take: 5,
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
      console.log(`  End Date: ${event.endDate || 'Not set'}`)
      console.log(`  Location: ${event.location || 'Not set'}`)
      console.log(`  Description: ${event.description || 'Not set'}`)
      console.log(`  Slug: ${event.slug}`)
      console.log(`  Created: ${event.createdAt}`)
      console.log(`  Counts: ${event._count.ceremonies} ceremonies, ${event._count.invitees} invitees, ${event._count.mediaAssets} media, ${event._count.interactions} interactions`)
      console.log('')
    })
    
    // Check if visibility field exists
    try {
      const testEvent = await prisma.event.findFirst({
        select: {
          id: true,
          // @ts-ignore
          visibility: true,
        },
      })
      console.log('Visibility field exists in database')
    } catch (error) {
      console.log('Visibility field does NOT exist in database (this is OK if migration not run)')
    }
    
    // Check if invitationDesigns table exists
    try {
      const designs = await prisma.invitationDesign.findMany({ take: 1 })
      console.log('InvitationDesign table exists')
    } catch (error) {
      console.log('InvitationDesign table does NOT exist (this is OK if migration not run)')
    }
    
  } catch (error) {
    console.error('Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()

