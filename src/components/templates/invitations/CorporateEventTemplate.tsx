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
  }
}

export function CorporateEventTemplate({ config, designData }: CorporateEventTemplateProps) {
  const colors = { ...config.colors, ...designData.colors }
  const text = designData.text || {}

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
        padding: '40px',
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
          fontSize: '32px',
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
            fontSize: '16px',
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
              fontSize: '16px',
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
            fontSize: '16px',
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
            fontSize: '14px',
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
    </div>
  )
}

