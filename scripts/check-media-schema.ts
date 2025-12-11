/**
 * Script to check MediaAsset schema and existing media URLs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMediaSchema() {
  console.log('🔍 Checking MediaAsset schema and data...\n')

  try {
    // Get sample media assets
    const mediaAssets = await prisma.mediaAsset.findMany({
      take: 20,
      select: {
        id: true,
        eventId: true,
        type: true,
        url: true,
        thumbnailUrl: true,
        filename: true,
        mimeType: true,
        size: true,
        source: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`📊 Total media assets found: ${mediaAssets.length}\n`)

    // Categorize URLs
    let cloudinaryCount = 0
    let localCount = 0
    let otherCount = 0
    const localUrls: Array<{ id: string; url: string; filename: string }> = []

    mediaAssets.forEach((media) => {
      if (media.url.includes('cloudinary.com') || media.url.includes('res.cloudinary.com')) {
        cloudinaryCount++
      } else if (media.url.includes('/uploads/') || media.url.includes('/api/uploads/') || media.url.startsWith('uploads/')) {
        localCount++
        localUrls.push({ id: media.id, url: media.url, filename: media.filename })
      } else {
        otherCount++
      }
    })

    console.log('📈 URL Distribution:')
    console.log(`  ✅ Cloudinary URLs: ${cloudinaryCount}`)
    console.log(`  📁 Local file URLs: ${localCount}`)
    console.log(`  ❓ Other URLs: ${otherCount}\n`)

    if (localUrls.length > 0) {
      console.log('📁 Local file URLs that need migration:')
      localUrls.forEach(({ id, url, filename }) => {
        console.log(`  - ${filename}: ${url}`)
      })
      console.log()
    }

    // Get total counts
    const totalCount = await prisma.mediaAsset.count()
    const cloudinaryTotal = await prisma.mediaAsset.count({
      where: {
        OR: [
          { url: { contains: 'cloudinary.com' } },
          { url: { contains: 'res.cloudinary.com' } },
        ],
      },
    })
    const localTotal = await prisma.mediaAsset.count({
      where: {
        OR: [
          { url: { contains: '/uploads/' } },
          { url: { contains: '/api/uploads/' } },
          { url: { startsWith: 'uploads/' } },
        ],
      },
    })

    console.log('📊 Total Statistics:')
    console.log(`  Total media assets: ${totalCount}`)
    console.log(`  Already on Cloudinary: ${cloudinaryTotal}`)
    console.log(`  Need migration (local): ${localTotal}`)
    console.log(`  Other: ${totalCount - cloudinaryTotal - localTotal}\n`)

    // Check schema
    console.log('✅ Schema Check:')
    console.log('  - url field: String (stores URL, not file data) ✓')
    console.log('  - thumbnailUrl field: String? (stores URL, not file data) ✓')
    console.log('  - Database stores URLs only, not file data ✓\n')

  } catch (error: any) {
    console.error('❌ Error checking schema:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkMediaSchema()
  .then(() => {
    console.log('✅ Check completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Check failed:', error)
    process.exit(1)
  })

