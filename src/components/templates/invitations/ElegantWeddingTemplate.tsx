'use client'

import React from 'react'

interface ElegantWeddingTemplateProps {
  config: {
    textFields: Array<{
      id: string
      label: string
      placeholder: string
      default: string
    }>
    colors: {
      primary: string
      secondary: string
      accent?: string
      background: string
      text: string
      heading?: string
      body?: string
    }
  }
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
  }
}

export function ElegantWeddingTemplate({ config, designData }: ElegantWeddingTemplateProps) {
  // Ensure we have valid config and designData
  if (!config || !config.colors) {
    console.error('ElegantWeddingTemplate: Missing config or config.colors', { config, designData })
    return <div>Error: Template configuration is missing</div>
  }

  const colors = { 
    primary: config.colors.primary || '#9333ea',
    secondary: config.colors.secondary || '#ec4899',
    accent: config.colors.accent || config.colors.secondary || '#ec4899',
    background: config.colors.background || '#ffffff',
    text: config.colors.text || '#111827',
    heading: config.colors.heading || config.colors.text || '#111827',
    body: config.colors.body || config.colors.text || '#4b5563',
    ...(designData?.colors || {}),
  }
  
  const text = designData?.text || {}
  
  // Get styles from designData or use defaults
  const styles = {
    fontSize: {
      heading: designData?.styles?.fontSize?.heading || 32,
      subheading: designData?.styles?.fontSize?.subheading || 24,
      body: designData?.styles?.fontSize?.body || 16,
    },
    spacing: {
      padding: designData?.styles?.spacing?.padding || 40,
      margin: {
        top: designData?.styles?.spacing?.margin?.top || 20,
        bottom: designData?.styles?.spacing?.margin?.bottom || 20,
      },
    },
  }

  return (
    <div
      className="invitation-template elegant-wedding"
      style={{
        width: '100%',
        height: '100%',
        minWidth: '400px',
        minHeight: '500px',
        background: colors.background || '#ffffff',
        color: colors.text || '#111827',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        flexDirection: 'column',
        padding: `${styles.spacing.padding}px`,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Decorative elements */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: '100px',
          height: '100px',
          border: `2px solid ${colors.accent || colors.secondary}`,
          borderRadius: '50%',
          opacity: 0.1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '100px',
          height: '100px',
          border: `2px solid ${colors.accent || colors.secondary}`,
          borderRadius: '50%',
          opacity: 0.1,
        }}
      />

      {/* Main content */}
      <h1
        style={{
          color: colors.primary,
          fontSize: `${styles.fontSize.heading}px`,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: `${styles.spacing.margin.bottom}px`,
          marginTop: `${styles.spacing.margin.top}px`,
        }}
      >
        {text.bride_name || 'Bride'} & {text.groom_name || 'Groom'}
      </h1>

      <div
        style={{
          width: '80px',
          height: '2px',
          background: colors.secondary,
          margin: '20px auto',
        }}
      />

      <h2
        style={{
          color: colors.heading || colors.primary,
          fontSize: `${styles.fontSize.subheading}px`,
          textAlign: 'center',
          marginBottom: `${styles.spacing.margin.bottom}px`,
        }}
      >
        {text.date || 'Wedding Date'}
      </h2>

      <p
        style={{
          color: colors.body || colors.text,
          fontSize: `${styles.fontSize.body}px`,
          lineHeight: '1.6',
          textAlign: 'center',
          marginBottom: `${styles.spacing.margin.bottom}px`,
        }}
      >
        {text.venue || 'Venue'}
      </p>

      <div style={{ marginTop: `${styles.spacing.margin.top * 2}px`, textAlign: 'center' }}>
        <p
          style={{
            color: colors.body || colors.text,
            fontSize: `${styles.fontSize.body}px`,
            lineHeight: '1.6',
            fontStyle: 'italic',
          }}
        >
          {text.message || config.textFields.find((f) => f.id === 'message')?.default || ''}
        </p>
      </div>

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
                zIndex: 1,
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
    </div>
  )
}

