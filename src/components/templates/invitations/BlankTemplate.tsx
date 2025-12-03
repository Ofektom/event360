'use client'

import React from 'react'

interface BlankTemplateProps {
  config?: any
  designData: {
    text: Record<string, string>
    colors: Record<string, string>
    styles?: {
      fontSize?: {
        heading?: number
        subheading?: number
        body?: number
      }
      spacing?: {
        padding?: number
        margin?: {
          top?: number
          bottom?: number
        }
      }
    }
    shapes?: Array<{
      id: string
      name: string
      svgPath: string
      color: string
      position: { x: number; y: number }
      size: { width: number; height: number }
    }>
    textBoxes?: Array<{
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
      showBorder?: boolean
      isBold?: boolean
    }>
    orientation?: 'portrait' | 'landscape'
  }
}

export function BlankTemplate({ config, designData }: BlankTemplateProps) {
  const backgroundColor = designData.colors?.background || '#ffffff'
  const padding = designData.styles?.spacing?.padding || 40
  const marginTop = designData.styles?.spacing?.margin?.top || 20
  const marginBottom = designData.styles?.spacing?.margin?.bottom || 20
  
  const headingSize = designData.styles?.fontSize?.heading || 32
  const subheadingSize = designData.styles?.fontSize?.subheading || 24
  const bodySize = designData.styles?.fontSize?.body || 16

  // Get text values - use custom fields or default structure
  const textValues = designData.text || {}
  const primaryColor = designData.colors?.primary || '#9333ea'
  const textColor = designData.colors?.text || designData.colors?.heading || '#111827'
  const bodyColor = designData.colors?.body || '#4b5563'
  
  // Orientation support
  const orientation = designData.orientation || 'portrait'
  const isLandscape = orientation === 'landscape'

  // Calculate dimensions based on orientation
  const width = isLandscape ? '600px' : '400px'
  const height = isLandscape ? '400px' : '500px'
  
  return (
    <div
      style={{
        width,
        height,
        minWidth: width,
        minHeight: height,
        backgroundColor,
        padding: `${padding}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Render custom text fields */}
      {Object.entries(textValues).map(([key, value], index) => {
        if (!value) return null
        
        // Determine if this is a heading, subheading, or body text based on key or position
        const isHeading = key.includes('heading') || key.includes('title') || key.includes('name') || index === 0
        const isSubheading = key.includes('subheading') || key.includes('date') || key.includes('venue') || index === 1
        
        const fontSize = isHeading ? headingSize : isSubheading ? subheadingSize : bodySize
        const color = isHeading ? primaryColor : isSubheading ? textColor : bodyColor
        const margin = index === 0 ? marginTop : marginBottom

        return (
          <div
            key={key}
            style={{
              fontSize: `${fontSize}px`,
              color,
              fontWeight: isHeading ? 'bold' : isSubheading ? '600' : 'normal',
              textAlign: 'center',
              marginTop: index > 0 ? `${margin}px` : '0',
              marginBottom: index < Object.keys(textValues).length - 1 ? `${margin}px` : '0',
              width: '100%',
            }}
          >
            {value}
          </div>
        )
      })}

      {/* Show placeholder only if canvas is completely untouched (default background, no content) */}
      {(() => {
        // Check if background color has been changed from default
        const isDefaultBackground = backgroundColor === '#ffffff' || backgroundColor === '#FFFFFF' || backgroundColor === 'white';
        
        // Check for text values with actual content
        const hasTextValues = Object.keys(textValues).length > 0 && 
          Object.values(textValues).some(v => v && String(v).trim() !== '');
        
        // Check for text boxes (even empty ones count as content since user has started working)
        const hasTextBoxes = designData.textBoxes && designData.textBoxes.length > 0;
        
        // Check for shapes
        const hasShapes = designData.shapes && designData.shapes.length > 0;
        
        // Hide placeholder if background was changed OR if there's any content
        const hasBeenCustomized = !isDefaultBackground || hasTextValues || hasTextBoxes || hasShapes;
        
        // Only show placeholder if canvas is completely untouched
        if (hasBeenCustomized) {
          return null;
        }
        
        return (
          <div
            style={{
              fontSize: `${bodySize}px`,
              color: bodyColor,
              textAlign: 'center',
              opacity: 0.5,
            }}
          >
            Add text fields to customize your invitation
          </div>
        );
      })()}

      {/* Render shapes */}
      {designData.shapes && designData.shapes.length > 0 && (
        <>
          {designData.shapes.map((shape) => (
            <div
              key={shape.id}
              style={{
                position: 'absolute',
                left: `${shape.position.x}px`,
                top: `${shape.position.y}px`,
                width: `${shape.size.width}px`,
                height: `${shape.size.height}px`,
              }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                style={{ color: shape.color }}
              >
                <g dangerouslySetInnerHTML={{ __html: shape.svgPath }} />
              </svg>
            </div>
          ))}
        </>
      )}

      {/* Render text boxes for image generation */}
      {designData.textBoxes && designData.textBoxes.length > 0 && (
        <>
          {designData.textBoxes.map((textBox) => (
            <div
              key={textBox.id}
              style={{
                position: 'absolute',
                left: `${textBox.position.x}px`,
                top: `${textBox.position.y}px`,
                width: `${textBox.size.width}px`,
                height: `${textBox.size.height}px`,
                fontSize: `${textBox.fontSize}px`,
                color: textBox.color,
                backgroundColor: textBox.hasFill && textBox.backgroundColor ? textBox.backgroundColor : 'transparent',
                fontFamily: textBox.fontFamily || 'inherit',
                fontWeight: textBox.fontWeight || (textBox.isBold ? 'bold' : 'normal'),
                textAlign: textBox.textAlign || 'left',
                border: textBox.showBorder ? `1px solid ${textBox.color}` : 'none',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                zIndex: 2,
              }}
            >
              {textBox.text || ''}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

