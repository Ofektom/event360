'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/atoms/Card'
import { Input } from '@/components/atoms/Input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface Shape {
  id: string
  name: string
  category: string
  type: 'shape' | 'symbol'
  svgPath: string
  defaultColor: string
}

interface ShapesLibraryProps {
  onSelectShape: (shape: Shape) => void
  onClose: () => void
}

export function ShapesLibrary({ onSelectShape, onClose }: ShapesLibraryProps) {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    fetchShapes()
  }, [])

  const fetchShapes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shapes')
      if (!response.ok) {
        throw new Error('Failed to fetch shapes')
      }
      const data = await response.json()
      setShapes(data)
    } catch (error) {
      console.error('Error fetching shapes:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', 'geometric', 'decorative', 'symbols']
  const types = ['all', 'shape', 'symbol']

  const filteredShapes = useMemo(() => {
    return shapes.filter((shape) => {
      const matchesSearch =
        shape.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shape.category.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === 'all' || shape.category === selectedCategory

      const matchesType =
        selectedType === 'all' || shape.type === selectedType

      return matchesSearch && matchesCategory && matchesType
    })
  }, [shapes, searchQuery, selectedCategory, selectedType])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Shapes & Symbols</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-4">
        <Input
          type="text"
          placeholder="Search shapes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shapes Grid */}
      {filteredShapes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔷</div>
          <p className="text-sm">No shapes found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
          {filteredShapes.map((shape) => (
            <button
              key={shape.id}
              onClick={() => onSelectShape(shape)}
              className="p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all bg-white"
              title={shape.name}
            >
              <div className="w-full aspect-square flex items-center justify-center">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                  style={{ color: shape.defaultColor }}
                  className="max-w-full max-h-full"
                >
                  <g dangerouslySetInnerHTML={{ __html: shape.svgPath }} />
                </svg>
              </div>
              <p className="text-xs text-gray-600 mt-1 truncate">{shape.name}</p>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

