'use client'

import { useState, useRef, useEffect } from 'react'

interface Shape {
  id: string
  name: string
  svgPath: string
  color: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation?: number
}

interface EditableShapeProps {
  shape: Shape
  onUpdate: (updates: Partial<Shape>) => void
  onDelete: () => void
  isSelected: boolean
  onSelect: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function EditableShape({
  shape,
  onUpdate,
  onDelete,
  isSelected,
  onSelect,
  containerRef,
}: EditableShapeProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 })
  const shapeRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
    
    if (e.target === shapeRef.current || (e.target as HTMLElement).closest('.shape-content')) {
      setIsDragging(true)
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setDragStart({
          x: e.clientX - rect.left - shape.position.x,
          y: e.clientY - rect.top - shape.position.y,
        })
      }
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setResizeStart({
        width: shape.size.width,
        height: shape.size.height,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()

      if (isDragging) {
        const newX = e.clientX - rect.left - dragStart.x
        const newY = e.clientY - rect.top - dragStart.y
        
        // Constrain to container bounds
        const maxX = rect.width - shape.size.width
        const maxY = rect.height - shape.size.height
        
        onUpdate({
          position: {
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
          },
        })
      } else if (isResizing) {
        const deltaX = e.clientX - rect.left - resizeStart.x
        const deltaY = e.clientY - rect.top - resizeStart.y
        
        // Maintain aspect ratio or allow free resize
        const newWidth = Math.max(20, resizeStart.width + deltaX)
        const newHeight = Math.max(20, resizeStart.height + deltaY)
        
        onUpdate({
          size: {
            width: newWidth,
            height: newHeight,
          },
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, resizeStart, shape.size, containerRef, onUpdate])

  return (
    <div
      ref={shapeRef}
      className={`absolute cursor-move ${isSelected ? 'z-10' : 'z-0'}`}
      style={{
        left: `${shape.position.x}px`,
        top: `${shape.position.y}px`,
        width: `${shape.size.width}px`,
        height: `${shape.size.height}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Shape Content */}
      <div className="shape-content w-full h-full relative">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          style={{ color: shape.color }}
          className="w-full h-full"
        >
          <g dangerouslySetInnerHTML={{ __html: shape.svgPath }} />
        </svg>

        {/* Selection Border */}
        {isSelected && (
          <div className="absolute inset-0 border-2 border-purple-500 border-dashed pointer-events-none" />
        )}

        {/* Resize Handle */}
        {isSelected && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 border-2 border-white rounded-full cursor-nwse-resize"
            onMouseDown={handleResizeMouseDown}
            style={{ transform: 'translate(50%, 50%)' }}
          />
        )}

        {/* Delete Button */}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

