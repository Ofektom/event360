import { MediaType, MediaSource } from './enums'

// Request DTOs
export interface CreateMediaAssetDto {
  ceremonyId?: string
  uploadedById?: string
  type: MediaType
  url: string
  thumbnailUrl?: string
  filename: string
  mimeType: string
  size?: number
  width?: number
  height?: number
  duration?: number
  caption?: string
  tags?: string[]
  source?: MediaSource
  sourceUrl?: string
  socialMediaId?: string
  socialPlatform?: string
}

export interface GetMediaFilters {
  ceremonyId?: string
  isApproved?: boolean
  isFeatured?: boolean
  type?: MediaType
}

