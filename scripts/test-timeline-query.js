const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testQuery() {
  try {
    console.log('=== Testing Timeline Query ===\n')
    
    // First, get the user who owns the event
    const event = await prisma.event.findFirst({
      where: { title: 'Wedding' },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })
    
    if (!event) {
      console.log('❌ Event not found!')
      return
    }
    
    console.log('Event found:')
    console.log(`  ID: ${event.id}`)
    console.log(`  Title: ${event.title}`)
    console.log(`  Status: ${event.status}`)
    console.log(`  Owner ID: ${event.ownerId}`)
    console.log(`  Owner Email: ${event.owner.email}`)
    console.log(`  Owner Name: ${event.owner.name}`)
    console.log('')
    
    // Now test the query that should find this event
    const userId = event.ownerId
    console.log(`Testing query for user ID: ${userId}`)
    console.log('')
    
    // Test 1: Direct Prisma query (what the fallback uses)
    console.log('Test 1: Direct Prisma query (fallback method)')
    try {
      const directEvents = await prisma.event.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          status: true,
          createdAt: true,
          startDate: true,
          endDate: true,
          location: true,
          description: true,
          ownerId: true,
        },
      })
      console.log(`✅ Found ${directEvents.length} events`)
      directEvents.forEach(e => {
        console.log(`  - ${e.title} (${e.id})`)
      })
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
    console.log('')
    
    // Test 2: Query with include (what the repository uses)
    console.log('Test 2: Query with include (repository method)')
    try {
      const includeEvents = await prisma.event.findMany({
        where: { ownerId: userId },
        include: {
          theme: true,
          ceremonies: true, // Without orderBy first
          _count: {
            select: {
              invitees: true,
              mediaAssets: true,
              ceremonies: true,
              interactions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      console.log(`✅ Found ${includeEvents.length} events`)
      includeEvents.forEach(e => {
        console.log(`  - ${e.title} (${e.id})`)
        console.log(`    Status: ${e.status}`)
        console.log(`    Counts: ${e._count.ceremonies} ceremonies, ${e._count.invitees} invitees`)
      })
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
    console.log('')
    
    // Test 3: Query for event posts (what timeline uses)
    console.log('Test 3: Query for event posts (timeline method)')
    try {
      const eventPosts = await prisma.event.findMany({
        where: {
          ownerId: userId,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              mediaAssets: true,
              interactions: true,
              invitees: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      })
      console.log(`✅ Found ${eventPosts.length} events`)
      eventPosts.forEach(e => {
        console.log(`  - ${e.title} (${e.id})`)
        console.log(`    Status: ${e.status}`)
        console.log(`    Owner: ${e.owner.name} (${e.owner.email})`)
        console.log(`    Counts: ${e._count.mediaAssets} media, ${e._count.interactions} interactions`)
      })
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
    console.log('')
    
    // Test 4: Check if user can be found by email
    console.log('Test 4: Finding user by email')
    try {
      const user = await prisma.user.findUnique({
        where: { email: event.owner.email },
        select: {
          id: true,
          email: true,
          name: true,
        },
      })
      if (user) {
        console.log(`✅ User found: ${user.email} (ID: ${user.id})`)
        console.log(`   Matches event owner ID: ${user.id === event.ownerId ? 'YES ✅' : 'NO ❌'}`)
      } else {
        console.log(`❌ User not found`)
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testQuery()

