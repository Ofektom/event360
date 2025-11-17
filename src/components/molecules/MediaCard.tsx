import { Card } from '@/components/atoms/Card'
import Image from 'next/image'

interface MediaCardProps {
  src: string
  alt: string
  title?: string
  description?: string
  onClick?: () => void
  aspectRatio?: 'square' | 'landscape' | 'portrait'
}

export function MediaCard({
  src,
  alt,
  title,
  description,
  onClick,
  aspectRatio = 'square',
}: MediaCardProps) {
  const aspectRatios = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
  }

  return (
    <Card
      variant="elevated"
      padding="none"
      className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
      onClick={onClick}
    >
      <div className={`relative w-full ${aspectRatios[aspectRatio]}`}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
        />
      </div>
      {(title || description) && (
        <div className="p-4">
          {title && (
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
    </Card>
  )
}

