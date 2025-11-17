'use client'

import { Card } from '@/components/atoms/Card'
import Image from 'next/image'

interface Vendor {
  id: string
  name: string
  category: string
  bio?: string
  image?: string
  website?: string
  contact?: string
}

interface VendorSectionProps {
  vendors: Vendor[]
  columns?: 2 | 3 | 4
}

export function VendorSection({ vendors, columns = 3 }: VendorSectionProps) {
  const columnClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid ${columnClasses[columns]} gap-6`}>
      {vendors.map((vendor) => (
        <Card key={vendor.id} variant="elevated" padding="md" className="text-center">
          {vendor.image && (
            <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
              <Image
                src={vendor.image}
                alt={vendor.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
            <p className="text-sm text-[var(--theme-primary)] font-medium">
              {vendor.category}
            </p>
          </div>
          {vendor.bio && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{vendor.bio}</p>
          )}
          <div className="flex justify-center gap-4">
            {vendor.website && (
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--theme-primary)] hover:underline"
              >
                Website
              </a>
            )}
            {vendor.contact && (
              <a
                href={`tel:${vendor.contact}`}
                className="text-sm text-[var(--theme-primary)] hover:underline"
              >
                Contact
              </a>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

