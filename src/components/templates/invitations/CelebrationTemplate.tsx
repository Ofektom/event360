'use client'

import React from 'react'

interface CelebrationTemplateProps {
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

export function CelebrationTemplate({ config, designData }: CelebrationTemplateProps) {
  const colors = { ...config.colors, ...designData.colors }
  const text = designData.text || {}
  const titleField = config.textFields.find((f) => f.id === 'title') || config.textFields[0]
  
  // Get styles from designData or use defaults
  const styles = {
    fontSize: {
      heading: designData?.styles?.fontSize?.heading || 36,
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
      className="invitation-template celebration"
      style={{
        width: '400px',
        height: '500px',
        background: `linear-gradient(135deg, ${colors.background}, ${colors.primary}10)`,
        color: colors.text,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: `${styles.spacing.padding}px`,
        position: 'relative',
      }}
    >
      {/* Decorative corner elements */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: '60px',
          height: '60px',
          borderTop: `3px solid ${colors.primary}`,
          borderLeft: `3px solid ${colors.primary}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderTop: `3px solid ${colors.primary}`,
          borderRight: `3px solid ${colors.primary}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          width: '60px',
          height: '60px',
          borderBottom: `3px solid ${colors.primary}`,
          borderLeft: `3px solid ${colors.primary}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderBottom: `3px solid ${colors.primary}`,
          borderRight: `3px solid ${colors.primary}`,
        }}
      />

      {/* Main content */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            color: colors.primary,
            fontSize: `${styles.fontSize.heading}px`,
            fontWeight: 'bold',
            marginBottom: '30px',
          }}
        >
          {text[titleField?.id || 'title'] || 'Event Title'}
        </h1>

        <div
          style={{
            width: '100px',
            height: '2px',
            background: colors.secondary,
            margin: '20px auto',
          }}
        />

        <p
          style={{
            fontSize: `${styles.fontSize.subheading * 0.8}px`,
            color: colors.heading || colors.text,
            marginTop: '20px',
            marginBottom: '15px',
          }}
        >
          {text.date || 'Date'}
        </p>

        <p
          style={{
            fontSize: `${styles.fontSize.body * 1.1}px`,
            color: colors.body || colors.text,
            marginBottom: '30px',
          }}
        >
          {text.venue || 'Venue'}
        </p>

        <p
          style={{
            fontSize: `${styles.fontSize.body}px`,
            color: colors.body || colors.text,
            fontStyle: 'italic',
            marginTop: '30px',
            lineHeight: '1.6',
          }}
        >
          {text.message || 'You are invited to join us!'}
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

