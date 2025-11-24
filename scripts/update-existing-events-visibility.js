const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateExistingEvents() {
  try {
    console.log('=== Updating Existing Events Visibility ===\n')
    
    // Update all existing events to PUBLIC visibility
    const result = await prisma.event.updateMany({
      where: {
        // Update all events (or you can filter by specific criteria)
      },
      data: {
        visibility: 'PUBLIC',
      },
    })
    
    console.log(`✅ Updated ${result.count} events to PUBLIC visibility`)
    
    // Verify the update
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        visibility: true,
      },
    })
    
    console.log('\n=== Updated Events ===')
    events.forEach((event) => {
      console.log(`  - ${event.title}: ${event.visibility}`)
    })
    
    console.log('\n=== Update Complete ===')
    
  } catch (error) {
    console.error('Error updating events:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateExistingEvents()

