'use client'

import React from 'react'

interface CorporateEventTemplateProps {
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

export function CorporateEventTemplate({ config, designData }: CorporateEventTemplateProps) {
  const colors = { ...config.colors, ...designData.colors }
  const text = designData.text || {}
  
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
      className="invitation-template corporate-event"
      style={{
        width: '400px',
        height: '500px',
        background: colors.background,
        color: colors.text,
        fontFamily: "'Arial', 'Helvetica', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: `${styles.spacing.padding}px`,
        position: 'relative',
      }}
    >
      {/* Header line */}
      <div
        style={{
          width: '100%',
          height: '4px',
          background: colors.primary,
          marginBottom: '30px',
        }}
      />

      {/* Event name */}
      <h1
        style={{
          color: colors.primary,
          fontSize: `${styles.fontSize.heading}px`,
          fontWeight: 'bold',
          borderBottom: `3px solid ${colors.primary}`,
          paddingBottom: '15px',
          marginBottom: '30px',
        }}
      >
        {text.event_name || 'Event Name'}
      </h1>

      {/* Event details */}
      <div style={{ marginBottom: '20px' }}>
        <p
          style={{
            fontSize: `${styles.fontSize.body}px`,
            color: colors.text,
            marginBottom: '10px',
            lineHeight: '1.8',
          }}
        >
          <strong style={{ color: colors.heading || colors.primary }}>Date:</strong>{' '}
          {text.date || 'Date'}
        </p>
        {text.time && (
          <p
            style={{
              fontSize: `${styles.fontSize.body}px`,
              color: colors.text,
              marginBottom: '10px',
              lineHeight: '1.8',
            }}
          >
            <strong style={{ color: colors.heading || colors.primary }}>Time:</strong>{' '}
            {text.time}
          </p>
        )}
        <p
          style={{
            fontSize: `${styles.fontSize.body}px`,
            color: colors.text,
            marginBottom: '10px',
            lineHeight: '1.8',
          }}
        >
          <strong style={{ color: colors.heading || colors.primary }}>Venue:</strong>{' '}
          {text.venue || 'Venue'}
        </p>
      </div>

      {/* RSVP section */}
      <div
        style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: `1px solid ${colors.secondary}`,
        }}
      >
        <p
          style={{
            fontSize: `${styles.fontSize.body * 0.875}px`,
            color: colors.body || colors.text,
            lineHeight: '1.6',
          }}
        >
          {text.rsvp || 'Please RSVP by [date]'}
        </p>
      </div>

      {/* Footer line */}
      <div
        style={{
          width: '100%',
          height: '4px',
          background: colors.primary,
          marginTop: 'auto',
        }}
      />

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

