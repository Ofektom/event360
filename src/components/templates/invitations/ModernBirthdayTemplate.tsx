'use client'

import React from 'react'

interface ModernBirthdayTemplateProps {
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

export function ModernBirthdayTemplate({ config, designData }: ModernBirthdayTemplateProps) {
  const colors = { ...config.colors, ...designData.colors }
  const text = designData.text || {}

  return (
    <div
      className="invitation-template modern-birthday"
      style={{
        width: '400px',
        height: '500px',
        background: colors.background,
        color: colors.text,
        fontFamily: "'Arial', 'Helvetica', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        position: 'relative',
      }}
    >
      {/* Decorative circle */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`,
          zIndex: 0,
        }}
      />

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: colors.primary,
            marginBottom: '10px',
          }}
        >
          {text.name || 'Name'}
        </h1>

        {text.age && (
          <h2
            style={{
              fontSize: '36px',
              color: colors.secondary,
              marginBottom: '20px',
            }}
          >
            {text.age} Years Old
          </h2>
        )}

        <div
          style={{
            width: '100px',
            height: '3px',
            background: colors.secondary,
            margin: '20px auto',
          }}
        />

        <p
          style={{
            fontSize: '20px',
            color: colors.heading || colors.text,
            marginTop: '20px',
            marginBottom: '10px',
          }}
        >
          {text.date || 'Date'}
        </p>

        <p
          style={{
            fontSize: '18px',
            color: colors.body || colors.text,
            marginBottom: '30px',
          }}
        >
          {text.venue || 'Venue'}
        </p>

        <p
          style={{
            fontSize: '16px',
            color: colors.body || colors.text,
            fontStyle: 'italic',
            marginTop: '30px',
          }}
        >
          {text.message || 'Join us for a celebration!'}
        </p>
      </div>
    </div>
  )
}

