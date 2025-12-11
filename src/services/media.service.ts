import { MediaRepository } from '@/repositories/media.repository'
import { CreateMediaAssetDto, GetMediaFilters } from '@/types/media.types'

export class MediaService {
  private mediaRepository: MediaRepository

  constructor() {
    this.mediaRepository = new MediaRepository()
  }

  async getMediaByEventId(eventId: string, filters?: GetMediaFilters) {
    return this.mediaRepository.findAllByEventId(eventId, filters)
  }

  async getMediaById(id: string) {
    const media = await this.mediaRepository.findById(id)
    if (!media) {
      throw new Error('Media asset not found')
    }
    return media
  }

  async createMediaAsset(eventId: string, data: CreateMediaAssetDto) {
    // Business logic validation
    if (!data.type || !data.url || !data.filename || !data.mimeType) {
      throw new Error('Type, URL, filename, and mimeType are required')
    }

    // Validate file size (e.g., max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (data.size && data.size > maxSize) {
      throw new Error('File size exceeds maximum allowed size of 50MB')
    }

    return this.mediaRepository.create(eventId, data)
  }

  async updateMediaAsset(id: string, data: Partial<CreateMediaAssetDto> & { isApproved?: boolean; isFeatured?: boolean }) {
    // Check if media exists
    await this.getMediaById(id)

    return this.mediaRepository.update(id, data)
  }

  async deleteMediaAsset(id: string): Promise<void> {
    // Check if media exists
    const media = await this.getMediaById(id)

    // Delete from Cloudinary if URL is a Cloudinary URL
    if (media.url.includes('cloudinary.com') || media.url.includes('res.cloudinary.com')) {
      try {
        const { deleteFromCloudinary } = await import('@/lib/cloudinary')
        // Extract public_id from Cloudinary URL
        // Format: https://res.cloudinary.com/cloud_name/resource_type/upload/v1234567890/folder/public_id.ext
        const urlParts = media.url.split('/upload/')
        if (urlParts.length === 2) {
          const pathParts = urlParts[1].split('/')
          // Skip version (v1234567890) and get folder + public_id
          const publicIdParts = pathParts.slice(1) // Skip version
          const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '') // Remove extension
          await deleteFromCloudinary(publicId)
          console.log(`✅ Deleted media from Cloudinary: ${publicId}`)
        }
      } catch (error: any) {
        console.error('⚠️  Failed to delete from Cloudinary:', error.message)
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    await this.mediaRepository.delete(id)
  }
}

