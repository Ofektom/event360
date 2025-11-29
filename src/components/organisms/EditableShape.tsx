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

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    const target = e.target as HTMLElement
    
    // If clicking on resize handle, start resizing
    if (target.closest('.resize-handle')) {
      onSelect()
      handleResizeMouseDown(e)
      return
    }
    
    // If clicking on delete button, just select (delete button handles its own click)
    if (target.closest('button[title="Delete shape"]')) {
      onSelect()
      return
    }
    
    // If clicking on the shape content
    if (target.closest('.shape-content') || target.closest('svg')) {
      // If not selected, just select
      if (!isSelected) {
        onSelect()
        return
      }
      
      // If already selected, start dragging
      setIsResizing(false) // Prevent resizing when dragging
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      
      setIsDragging(true)
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setDragStart({
          x: clientX - rect.left - shape.position.x,
          y: clientY - rect.top - shape.position.y,
        })
      }
      return
    }
    
    // Otherwise, clicking on the outer container - start dragging if selected
    if (isSelected) {
      setIsResizing(false) // Prevent resizing when dragging
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      
      setIsDragging(true)
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setDragStart({
          x: clientX - rect.left - shape.position.x,
          y: clientY - rect.top - shape.position.y,
        })
      }
    } else {
      // If not selected, just select
      onSelect()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    handleMouseDown(e)
  }

  const handleResizeMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    setIsDragging(false) // Prevent dragging when resizing
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      setResizeStart({
        width: shape.size.width,
        height: shape.size.height,
        x: clientX - rect.left,
        y: clientY - rect.top,
      })
    }
  }

  const handleResizeTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    handleResizeMouseDown(e)
  }

  useEffect(() => {
    const getClientCoordinates = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 0) {
        return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
      }
      // TypeScript knows this is MouseEvent after the TouchEvent check
      const mouseEvent = e as MouseEvent
      return { clientX: mouseEvent.clientX, clientY: mouseEvent.clientY }
    }

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const { clientX, clientY } = getClientCoordinates(e)

      if (isDragging) {
        const newX = clientX - rect.left - dragStart.x
        const newY = clientY - rect.top - dragStart.y
        
        // Constrain to container bounds
        const maxX = Math.max(0, rect.width - shape.size.width)
        const maxY = Math.max(0, rect.height - shape.size.height)
        
        onUpdate({
          position: {
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
          },
        })
      } else if (isResizing) {
        // Calculate delta from the resize start position
        const currentX = clientX - rect.left
        const currentY = clientY - rect.top
        const deltaX = currentX - resizeStart.x
        const deltaY = currentY - resizeStart.y
        
        // Calculate new size based on delta
        const newWidth = Math.max(20, resizeStart.width + deltaX)
        const newHeight = Math.max(20, resizeStart.height + deltaY)
        
        // Constrain to container bounds
        const maxWidth = rect.width - shape.position.x
        const maxHeight = rect.height - shape.position.y
        
        onUpdate({
          size: {
            width: Math.min(newWidth, maxWidth),
            height: Math.min(newHeight, maxHeight),
          },
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault() // Prevent scrolling while dragging
      handleMouseMove(e)
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, resizeStart, shape.size, shape.position, containerRef, onUpdate])

  return (
    <div
      ref={shapeRef}
      className={`absolute cursor-move ${isSelected ? 'z-10' : 'z-0'}`}
      style={{
        left: `${shape.position.x}px`,
        top: `${shape.position.y}px`,
        width: `${shape.size.width}px`,
        height: `${shape.size.height}px`,
        touchAction: 'none', // Prevent default touch behaviors (scrolling, zooming)
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Shape Content */}
      <div className="shape-content w-full h-full relative" style={{ position: 'relative' }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          style={{ color: shape.color, pointerEvents: 'none' }}
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
            className="resize-handle absolute bottom-0 right-0 bg-purple-500 border-2 border-white rounded-full cursor-nwse-resize z-20 hover:bg-purple-600 active:bg-purple-700"
            onMouseDown={handleResizeMouseDown}
            onTouchStart={handleResizeTouchStart}
            style={{ 
              transform: 'translate(50%, 50%)',
              width: '20px',
              height: '20px',
              minWidth: '20px',
              minHeight: '20px',
            }}
            title="Drag to resize"
          />
        )}

        {/* Delete Button */}
        {isSelected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onDelete()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
              // Don't trigger drag when clicking delete button
            }}
            onTouchStart={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onDelete()
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 active:bg-red-700 z-30"
            style={{ 
              pointerEvents: 'all',
            }}
            title="Delete shape"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

