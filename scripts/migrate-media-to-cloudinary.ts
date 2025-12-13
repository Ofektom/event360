/**
 * Migration Script: Migrate Media Assets to Cloudinary
 * 
 * This script:
 * 1. Finds all media assets with local file URLs (stored in database or public/uploads)
 * 2. Uploads them to Cloudinary
 * 3. Updates the database with Cloudinary URLs
 * 4. Deletes local files
 */

import { PrismaClient } from '@prisma/client'
import { readFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { uploadToCloudinary, isCloudinaryConfigured } from '../src/lib/cloudinary'

const prisma = new PrismaClient()

interface MediaAsset {
  id: string
  eventId: string
  type: string
  url: string
  thumbnailUrl: string | null
  filename: string
  mimeType: string
  size: number | null
}

async function migrateMediaToCloudinary() {
  console.log('🚀 Starting media migration to Cloudinary...\n')

  // Check Cloudinary configuration
  if (!isCloudinaryConfigured()) {
    console.error('❌ Cloudinary is not configured. Please set CLOUDINARY_URL or individual credentials.')
    process.exit(1)
  }

  console.log('✅ Cloudinary is configured\n')

  // Find all media assets
  const mediaAssets = await prisma.mediaAsset.findMany({
    select: {
      id: true,
      eventId: true,
      type: true,
      url: true,
      thumbnailUrl: true,
      filename: true,
      mimeType: true,
      size: true,
    },
  })

  console.log(`📊 Found ${mediaAssets.length} media assets to check\n`)

  let migrated = 0
  let skipped = 0
  let failed = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const media of mediaAssets) {
    try {
      // Check if URL is already a Cloudinary URL
      if (media.url.includes('cloudinary.com') || media.url.includes('res.cloudinary.com')) {
        console.log(`⏭️  Skipping ${media.filename} - already on Cloudinary`)
        skipped++
        continue
      }

      // Check if URL is a local file path
      let filePath: string | null = null
      let fileBuffer: Buffer | null = null

      // Check if it's a local file path (starts with /uploads/ or /api/uploads/)
      if (media.url.startsWith('/uploads/') || media.url.startsWith('/api/uploads/')) {
        const relativePath = media.url.replace('/api/uploads/', 'uploads/').replace('/uploads/', 'uploads/')
        filePath = join(process.cwd(), 'public', relativePath)
      } else if (media.url.startsWith('uploads/')) {
        filePath = join(process.cwd(), 'public', media.url)
      } else if (media.url.startsWith('http://localhost') || media.url.startsWith('http://127.0.0.1')) {
        // Local development URL - try to extract file path
        const urlPath = new URL(media.url).pathname
        if (urlPath.includes('/uploads/')) {
          const relativePath = urlPath.replace('/api/uploads/', 'uploads/').replace('/uploads/', 'uploads/')
          filePath = join(process.cwd(), 'public', relativePath)
        }
      }

      // If we found a local file path, try to read it
      if (filePath && existsSync(filePath)) {
        console.log(`📁 Found local file: ${filePath}`)
        fileBuffer = await readFile(filePath)
      } else if (filePath) {
        console.log(`⚠️  Local file not found: ${filePath}`)
        // Try to fetch from URL if it's a valid URL
        if (media.url.startsWith('http')) {
          try {
            const response = await fetch(media.url)
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer()
              fileBuffer = Buffer.from(arrayBuffer)
              console.log(`📥 Downloaded from URL: ${media.url}`)
            }
          } catch (fetchError) {
            console.log(`❌ Could not fetch from URL: ${media.url}`)
            failed++
            errors.push({ id: media.id, error: `File not found and URL not accessible: ${media.url}` })
            continue
          }
        } else {
          console.log(`❌ Cannot migrate: ${media.url} - not a valid file path or URL`)
          failed++
          errors.push({ id: media.id, error: `Invalid file path: ${media.url}` })
          continue
        }
      } else {
        // Not a local file - might already be on external storage or invalid
        console.log(`⏭️  Skipping ${media.filename} - URL format not recognized: ${media.url}`)
        skipped++
        continue
      }

      if (!fileBuffer) {
        console.log(`❌ No file buffer available for ${media.filename}`)
        failed++
        errors.push({ id: media.id, error: 'No file buffer available' })
        continue
      }

      // Upload to Cloudinary
      console.log(`☁️  Uploading ${media.filename} to Cloudinary...`)

      const resourceType = media.type === 'VIDEO' ? 'video' : 'image'
      const folder = `gbedoo/media/${media.eventId}`
      const timestamp = Date.now()
      const sanitizedName = media.filename.replace(/[^a-zA-Z0-9.-]/g, '_')
      const publicId = `${timestamp}-${sanitizedName.replace(/\.[^/.]+$/, '')}`

      const result = await uploadToCloudinary(fileBuffer, {
        folder,
        resourceType: resourceType as 'image' | 'video',
        publicId,
        overwrite: false,
      })

      let thumbnailUrl = result.secureUrl

      // Generate thumbnail for videos
      if (media.type === 'VIDEO') {
        const urlParts = result.secureUrl.split('/upload/')
        if (urlParts.length === 2) {
          const pathParts = urlParts[1].split('/')
          const version = pathParts[0]
          const filePath = pathParts.slice(1).join('/')
          const filePathWithoutExt = filePath.replace(/\.(mp4|mov|avi|webm|webp|mkv|flv)$/i, '')
          thumbnailUrl = `${urlParts[0]}/upload/w_400,h_300,c_fill/${version}/${filePathWithoutExt}.jpg`
        }
      }

      // Update database with Cloudinary URL
      await prisma.mediaAsset.update({
        where: { id: media.id },
        data: {
          url: result.secureUrl,
          thumbnailUrl: thumbnailUrl || media.thumbnailUrl,
        },
      })

      console.log(`✅ Migrated ${media.filename} to Cloudinary: ${result.secureUrl}`)

      // Delete local file if it exists
      if (filePath && existsSync(filePath)) {
        try {
          await unlink(filePath)
          console.log(`🗑️  Deleted local file: ${filePath}`)
        } catch (deleteError) {
          console.log(`⚠️  Could not delete local file: ${filePath}`)
        }
      }

      migrated++
    } catch (error: any) {
      console.error(`❌ Error migrating ${media.filename}:`, error.message)
      failed++
      errors.push({ id: media.id, error: error.message })
    }
  }

  console.log('\n📊 Migration Summary:')
  console.log(`✅ Migrated: ${migrated}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Failed: ${failed}`)

  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    errors.forEach(({ id, error }) => {
      console.log(`  - ${id}: ${error}`)
    })
  }

  await prisma.$disconnect()
}

// Run migration
migrateMediaToCloudinary()
  .then(() => {
    console.log('\n✅ Migration completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })

