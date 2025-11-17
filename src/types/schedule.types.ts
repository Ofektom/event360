// Request DTOs
export interface CreateScheduleItemDto {
  title: string
  description?: string
  startTime: Date | string
  endTime?: Date | string
  order?: number
  type?: string
  location?: string
  notes?: string
}

export interface UpdateScheduleItemDto {
  title?: string
  description?: string
  startTime?: Date | string
  endTime?: Date | string
  order?: number
  type?: string
  location?: string
  notes?: string
}

