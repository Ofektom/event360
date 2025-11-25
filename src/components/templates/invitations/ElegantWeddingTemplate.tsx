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
  }
}

export function ElegantWeddingTemplate({ config, designData }: ElegantWeddingTemplateProps) {
  const colors = { ...config.colors, ...designData.colors }
  const text = designData.text || {}

  return (
    <div
      className="invitation-template elegant-wedding"
      style={{
        width: '400px',
        height: '500px',
        background: colors.background,
        color: colors.text,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden',
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
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '20px',
          marginTop: '20px',
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
          fontSize: '24px',
          textAlign: 'center',
          marginBottom: '15px',
        }}
      >
        {text.date || 'Wedding Date'}
      </h2>

      <p
        style={{
          color: colors.body || colors.text,
          fontSize: '16px',
          lineHeight: '1.6',
          textAlign: 'center',
          marginBottom: '10px',
        }}
      >
        {text.venue || 'Venue'}
      </p>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <p
          style={{
            color: colors.body || colors.text,
            fontSize: '16px',
            lineHeight: '1.6',
            fontStyle: 'italic',
          }}
        >
          {text.message || config.textFields.find((f) => f.id === 'message')?.default || ''}
        </p>
      </div>
    </div>
  )
}

