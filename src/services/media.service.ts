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
    await this.getMediaById(id)

    // Business logic (e.g., delete from storage service)
    // TODO: Add storage cleanup logic here

    await this.mediaRepository.delete(id)
  }
}

