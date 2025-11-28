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
  fontWeight?: string | number
  textAlign?: 'left' | 'center' | 'right'
  showBorder?: boolean // Whether to show the text box border
  isBold?: boolean // Whether text is bold
}

interface EditableTextBoxProps {
  textBox: TextBox
  onUpdate: (updates: Partial<TextBox>) => void
  onDelete: () => void
  isSelected: boolean
  onSelect: () => void
  onDeselect?: () => void // Callback to deselect the text box
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function EditableTextBox({
  textBox,
  onUpdate,
  onDelete,
  isSelected,
  onSelect,
  onDeselect,
  containerRef,
}: EditableTextBoxProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 })
  const [autoWidth, setAutoWidth] = useState(true) // Auto-resize width based on content
  const [localText, setLocalText] = useState<string>('') // Local state for textarea value
  const textBoxRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const isUpdatingRef = useRef<boolean>(false) // Track if we're currently updating

  // Sync local text with textBox.text when it changes from parent (but not when we're updating)
  useEffect(() => {
    if (!isUpdatingRef.current) {
      setLocalText(textBox.text || '')
    }
  }, [textBox.text])
  
  // Initialize local text when editing starts
  useEffect(() => {
    if (isEditing) {
      setLocalText(textBox.text || '')
    }
  }, [isEditing, textBox.text])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Place cursor at end if text is empty, otherwise don't select
      if (!textBox.text) {
        textareaRef.current.setSelectionRange(0, 0)
      }
    }
  }, [isEditing, textBox.text])
  
  // Don't auto-start editing - let user explicitly choose to edit
  // This allows the drag handle to be visible when text box is selected
  // User can double-click or click on textarea to edit

  // Auto-resize width based on text content
  useEffect(() => {
    if (autoWidth && measureRef.current && textBox.text) {
      const width = Math.max(100, Math.min(measureRef.current.offsetWidth + 20, 500))
      if (width !== textBox.size.width) {
        onUpdate({ size: { ...textBox.size, width } })
      }
    }
  }, [textBox.text, autoWidth, textBox.size.width, onUpdate])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // If clicking on textarea, start editing
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') {
      onSelect()
      setIsEditing(true)
      return
    }
    
    // If clicking on resize handle, start resizing
    if ((e.target as HTMLElement).closest('.resize-handle')) {
      onSelect()
      handleResizeMouseDown(e)
      return
    }
    
    // If clicking on drag handle, start dragging (handled by drag handle's own onMouseDown)
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      // The drag handle has its own handler, just select
      onSelect()
      return
    }
    
    // If clicking on the text content area
    if ((e.target as HTMLElement).closest('.textbox-content')) {
      const target = e.target as HTMLElement
      
      // If clicking on textarea directly, start editing
      if (target.tagName === 'TEXTAREA') {
        onSelect()
        setIsEditing(true)
        return
      }
      
      // Check if clicking on the border/padding area (not the actual text)
      const contentDiv = target.closest('.textbox-content')
      if (contentDiv && isSelected && !isEditing) {
        const rect = contentDiv.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const clickY = e.clientY - rect.top
        const padding = 8 // padding value
        
        // If clicking near the edges (border area), start dragging
        const isNearEdge = 
          clickX < padding || 
          clickX > rect.width - padding ||
          clickY < padding || 
          clickY > rect.height - padding
        
        // If clicking on border area when selected, start dragging
        if (isNearEdge) {
          setIsDragging(true)
          const containerRect = containerRef.current?.getBoundingClientRect()
          if (containerRect) {
            setDragStart({
              x: e.clientX - containerRect.left - textBox.position.x,
              y: e.clientY - containerRect.top - textBox.position.y,
            })
          }
          return
        }
      }
      
      // If clicking on text content (not border), just select
      // Don't auto-start editing - user must double-click to edit
      if (!isSelected) {
        onSelect()
      }
      // Don't auto-start editing on single click - allows drag handle to be visible
      return
    }
    
    // Otherwise, clicking on the outer container (border area) - start dragging
    // Only start dragging if not editing and text box is already selected
    if (isSelected && !isEditing) {
      setIsDragging(true)
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setDragStart({
          x: e.clientX - rect.left - textBox.position.x,
          y: e.clientY - rect.top - textBox.position.y,
        })
      }
    } else {
      // If not selected or editing, just select
      onSelect()
    }
  }

  const handleDoubleClick = () => {
    setIsEditing(true)
  }
  
  const handleClick = (e: React.MouseEvent) => {
    // Don't auto-start editing on click - let user explicitly choose to edit
    // This allows the drag handle to be visible when text box is selected
    e.stopPropagation()
  }

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    const touch = e.touches[0]
    if (!touch) return
    
    // Create a synthetic mouse event for compatibility
    const syntheticEvent = {
      ...e,
      clientX: touch.clientX,
      clientY: touch.clientY,
      target: e.target,
      stopPropagation: () => e.stopPropagation(),
      preventDefault: () => e.preventDefault(),
    } as unknown as React.MouseEvent
    
    handleMouseDown(syntheticEvent)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    // Prevent click event from firing after touch
    e.preventDefault()
  }

  const handleResizeMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      setResizeStart({
        width: textBox.size.width,
        height: textBox.size.height,
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
      return { clientX: e.clientX, clientY: e.clientY }
    }

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const { clientX, clientY } = getClientCoordinates(e)

      if (isDragging) {
        const newX = clientX - rect.left - dragStart.x
        const newY = clientY - rect.top - dragStart.y
        
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
        const deltaX = clientX - rect.left - resizeStart.x
        const deltaY = clientY - rect.top - resizeStart.y
        
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
  }, [isDragging, isResizing, dragStart, resizeStart, textBox.size, containerRef, onUpdate])

  return (
    <div
      ref={textBoxRef}
      className={`editable-textbox absolute ${isSelected ? 'z-10' : 'z-0'}`}
      style={{
        left: `${textBox.position.x}px`,
        top: `${textBox.position.y}px`,
        width: `${textBox.size.width}px`,
        minHeight: `${textBox.size.height}px`,
        pointerEvents: 'all',
        cursor: isEditing ? 'text' : (isSelected && !isEditing ? 'move' : 'default'),
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      {/* Delete Button - Always on top, positioned outside drag handle area */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onDelete()
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow-lg"
          style={{
            zIndex: 200,
            pointerEvents: 'all',
          }}
          title="Delete text box"
        >
          ×
        </button>
      )}

      {/* Drag Handle - Show at top when selected for easier dragging */}
      {isSelected && !isEditing && (
        <div
          className="drag-handle absolute -top-1 left-0 cursor-move"
          onMouseDown={(e) => {
            // Don't start dragging if clicking on delete button
            if ((e.target as HTMLElement).closest('button')) {
              return
            }
            e.stopPropagation()
            e.preventDefault()
            onSelect()
            setIsDragging(true)
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
              setDragStart({
                x: e.clientX - rect.left - textBox.position.x,
                y: e.clientY - rect.top - textBox.position.y,
              })
            }
          }}
          onTouchStart={(e) => {
            // Don't start dragging if touching delete button
            if ((e.target as HTMLElement).closest('button')) {
              return
            }
            e.stopPropagation()
            e.preventDefault()
            const touch = e.touches[0]
            if (!touch) return
            onSelect()
            setIsDragging(true)
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
              setDragStart({
                x: touch.clientX - rect.left - textBox.position.x,
                y: touch.clientY - rect.top - textBox.position.y,
              })
            }
          }}
          style={{
            width: 'calc(100% - 24px)', // Leave space for delete button
            height: '28px',
            background: 'linear-gradient(to bottom, rgba(147, 51, 234, 0.4), rgba(147, 51, 234, 0.2))',
            borderTop: '3px solid #9333ea',
            borderLeft: '2px solid rgba(147, 51, 234, 0.3)',
            borderRight: '2px solid rgba(147, 51, 234, 0.3)',
            pointerEvents: 'all',
            borderRadius: '4px 4px 0 0',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(147, 51, 234, 0.2)',
          }}
          title="Drag to move"
        >
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-1 bg-purple-500 rounded-full opacity-60"></div>
          </div>
        </div>
      )}

      {/* Text Box Content */}
      <div
        className="textbox-content w-full h-full relative"
        style={{
          backgroundColor: textBox.hasFill ? (textBox.backgroundColor || '#ffffff') : 'transparent',
          border: textBox.showBorder 
            ? (isSelected ? '2px dashed #9333ea' : '1px solid rgba(0,0,0,0.3)')
            : (isSelected ? '2px dashed #9333ea' : 'none'),
          borderRadius: '4px',
          padding: '8px',
          minHeight: '100%',
          zIndex: isSelected && !isEditing ? 1 : 'auto',
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={localText}
            onChange={(e) => {
              e.stopPropagation() // Prevent event bubbling
              const newText = e.target.value
              
              // Update local state immediately for responsive typing
              setLocalText(newText)
              
              // Update parent only if text actually changed
              if (newText !== textBox.text && !isUpdatingRef.current) {
                isUpdatingRef.current = true
                onUpdate({ text: newText })
                // Reset the flag after a short delay to allow parent update to complete
                setTimeout(() => {
                  isUpdatingRef.current = false
                }, 0)
              }
              
              // Auto-resize height
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
                const newHeight = Math.max(40, textareaRef.current.scrollHeight)
                textareaRef.current.style.height = `${newHeight}px`
                
                // Auto-resize width based on content (but respect canvas bounds)
                if (autoWidth && containerRef.current) {
                  const containerRect = containerRef.current.getBoundingClientRect()
                  const maxWidth = containerRect.width - textBox.position.x - 20 // Leave some margin
                  
                  // Create a temporary span to measure text width
                  const measure = document.createElement('span')
                  measure.style.position = 'absolute'
                  measure.style.visibility = 'hidden'
                  measure.style.whiteSpace = 'pre'
                  measure.style.width = 'auto'
                  measure.style.fontSize = `${textBox.fontSize}px`
                  measure.style.fontFamily = textBox.fontFamily || 'inherit'
                  const fontWeight = textBox.isBold ? 'bold' : (textBox.fontWeight || 'normal')
                  measure.style.fontWeight = typeof fontWeight === 'number' ? fontWeight.toString() : fontWeight
                  measure.textContent = newText || 'M'
                  document.body.appendChild(measure)
                  
                  const textWidth = measure.offsetWidth + 20 // Add padding
                  const newWidth = Math.max(100, Math.min(textWidth, maxWidth))
                  document.body.removeChild(measure)
                  
                  if (newWidth !== textBox.size.width) {
                    onUpdate({ size: { ...textBox.size, width: newWidth } })
                  }
                }
              }
            }}
            onBlur={() => {
              // Ensure the text is saved before exiting editing mode
              const finalText = localText
              
              // Calculate height before updating to prevent text cutoff
              let finalHeight = textBox.size.height
              if (textareaRef.current) {
                // Reset height to auto to get accurate scrollHeight
                textareaRef.current.style.height = 'auto'
                finalHeight = Math.max(40, textareaRef.current.scrollHeight)
              }
              
              // Update both text and height together to prevent text cutoff
              if (finalText !== textBox.text || finalHeight !== textBox.size.height) {
                onUpdate({ 
                  text: finalText,
                  size: { ...textBox.size, height: finalHeight }
                })
              }
              
              setIsEditing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                // Save text and height before exiting
                const finalText = localText
                let finalHeight = textBox.size.height
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto'
                  finalHeight = Math.max(40, textareaRef.current.scrollHeight)
                }
                
                if (finalText !== textBox.text || finalHeight !== textBox.size.height) {
                  onUpdate({ 
                    text: finalText,
                    size: { ...textBox.size, height: finalHeight }
                  })
                }
                
                setIsEditing(false)
                e.preventDefault()
                // Deselect text box when pressing Escape
                if (onDeselect) {
                  onDeselect()
                }
              }
              // Enter key exits editing mode, deselects text box, and keeps formatting
              // Shift+Enter creates a new line
              if (e.key === 'Enter' && !e.shiftKey) {
                // Save text and height before exiting
                const finalText = localText
                let finalHeight = textBox.size.height
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto'
                  finalHeight = Math.max(40, textareaRef.current.scrollHeight)
                }
                
                if (finalText !== textBox.text || finalHeight !== textBox.size.height) {
                  onUpdate({ 
                    text: finalText,
                    size: { ...textBox.size, height: finalHeight }
                  })
                }
                
                setIsEditing(false)
                e.preventDefault()
                // Blur the textarea to ensure editing state is cleared
                if (textareaRef.current) {
                  textareaRef.current.blur()
                }
                // Deselect text box when pressing Enter (same as clicking outside)
                if (onDeselect) {
                  onDeselect()
                }
              }
            }}
            style={{
              width: '100%',
              minWidth: '100px',
              height: 'auto',
              minHeight: `${textBox.size.height}px`,
              fontSize: `${textBox.fontSize}px`,
              color: textBox.color,
              fontFamily: textBox.fontFamily || 'inherit',
              fontWeight: textBox.isBold ? 'bold' : (textBox.fontWeight || 'normal'),
              textAlign: textBox.textAlign || 'left',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
            className="w-full"
            placeholder="Type here..."
          />
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            style={{
              fontSize: `${textBox.fontSize}px`,
              color: textBox.color,
              fontFamily: textBox.fontFamily || 'inherit',
              fontWeight: textBox.isBold ? 'bold' : (textBox.fontWeight || 'normal'),
              textAlign: textBox.textAlign || 'left',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              minHeight: `${textBox.size.height}px`,
              height: 'auto',
              cursor: isSelected && !isEditing ? 'move' : 'text',
              width: '100%',
            }}
          >
            {(textBox.text || localText) || <span style={{ opacity: 0.5 }}>Double-click to edit</span>}
          </div>
        )}

        {/* Resize Handle - Always show when selected */}
        {isSelected && (
          <div
            className="resize-handle absolute bottom-0 right-0 w-5 h-5 bg-purple-500 border-2 border-white rounded-full cursor-nwse-resize z-20 hover:bg-purple-600"
            onMouseDown={handleResizeMouseDown}
            onTouchStart={handleResizeTouchStart}
            style={{ transform: 'translate(50%, 50%)' }}
            title="Drag to resize"
          />
        )}
      </div>
    </div>
  )
}

