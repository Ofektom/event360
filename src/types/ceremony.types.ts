// Request DTOs
export interface CreateCeremonyDto {
  name: string
  description?: string
  order?: number
  date: Date | string
  startTime?: Date | string
  endTime?: Date | string
  location?: string
  venue?: string
  dressCode?: string
  notes?: string
  streamUrl?: string
  streamKey?: string
}

export interface UpdateCeremonyDto {
  name?: string
  description?: string
  order?: number
  date?: Date | string
  startTime?: Date | string
  endTime?: Date | string
  location?: string
  venue?: string
  dressCode?: string
  notes?: string
  streamUrl?: string
  streamKey?: string
  isStreaming?: boolean
}

