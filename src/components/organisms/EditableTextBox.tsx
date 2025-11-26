'use client'

import { useState, useRef, useEffect } from 'react'

interface TextBox {
  id: string
  text: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  fontSize: number
  color: string
  backgroundColor?: string
  hasFill: boolean
  fontFamily?: string
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right'
}

interface EditableTextBoxProps {
  textBox: TextBox
  onUpdate: (updates: Partial<TextBox>) => void
  onDelete: () => void
  isSelected: boolean
  onSelect: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function EditableTextBox({
  textBox,
  onUpdate,
  onDelete,
  isSelected,
  onSelect,
  containerRef,
}: EditableTextBoxProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 })
  const textBoxRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
    
    if (e.target === textBoxRef.current || (e.target as HTMLElement).closest('.textbox-content')) {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') {
        setIsEditing(true)
        return
      }
      setIsDragging(true)
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setDragStart({
          x: e.clientX - rect.left - textBox.position.x,
          y: e.clientY - rect.top - textBox.position.y,
        })
      }
    }
  }

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setResizeStart({
        width: textBox.size.width,
        height: textBox.size.height,
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
        const maxX = rect.width - textBox.size.width
        const maxY = rect.height - textBox.size.height
        
        onUpdate({
          position: {
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
          },
        })
      } else if (isResizing) {
        const deltaX = e.clientX - rect.left - resizeStart.x
        const deltaY = e.clientY - rect.top - resizeStart.y
        
        const newWidth = Math.max(100, resizeStart.width + deltaX)
        const newHeight = Math.max(40, resizeStart.height + deltaY)
        
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
  }, [isDragging, isResizing, dragStart, resizeStart, textBox.size, containerRef, onUpdate])

  return (
    <div
      ref={textBoxRef}
      className={`absolute cursor-move ${isSelected ? 'z-10' : 'z-0'}`}
      style={{
        left: `${textBox.position.x}px`,
        top: `${textBox.position.y}px`,
        width: `${textBox.size.width}px`,
        minHeight: `${textBox.size.height}px`,
        pointerEvents: 'all',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Text Box Content */}
      <div
        className="textbox-content w-full h-full relative"
        style={{
          backgroundColor: textBox.hasFill ? (textBox.backgroundColor || '#ffffff') : 'transparent',
          border: isSelected ? '2px dashed #9333ea' : '1px solid rgba(0,0,0,0.1)',
          borderRadius: '4px',
          padding: '8px',
          minHeight: '100%',
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={textBox.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsEditing(false)
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              minHeight: `${textBox.size.height}px`,
              fontSize: `${textBox.fontSize}px`,
              color: textBox.color,
              fontFamily: textBox.fontFamily || 'inherit',
              fontWeight: textBox.fontWeight || 'normal',
              textAlign: textBox.textAlign || 'left',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
            }}
            className="w-full h-full"
          />
        ) : (
          <div
            style={{
              fontSize: `${textBox.fontSize}px`,
              color: textBox.color,
              fontFamily: textBox.fontFamily || 'inherit',
              fontWeight: textBox.fontWeight || 'normal',
              textAlign: textBox.textAlign || 'left',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              minHeight: `${textBox.size.height}px`,
            }}
          >
            {textBox.text || 'Double-click to edit'}
          </div>
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

