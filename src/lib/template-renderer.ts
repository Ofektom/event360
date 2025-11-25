/**
 * Template Renderer Utility
 * 
 * This utility handles rendering invitation templates from config data.
 * It can render templates programmatically and generate preview images.
 */

import html2canvas from 'html2canvas'

export interface TemplateConfig {
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
  graphics: Array<{
    id: string
    type: string
    url: string
  }>
}

export interface DesignData {
  text: Record<string, string>
  colors: Record<string, string>
  graphics?: Record<string, string>
  customFields?: Array<{
    id: string
    label: string
    value: string
  }>
  customGraphics?: Array<{
    id: string
    url: string
    type: string
  }>
}

/**
 * Generate a preview image from an HTML element
 */
export async function generatePreviewFromElement(
  element: HTMLElement,
  options?: {
    width?: number
    height?: number
    scale?: number
  }
): Promise<string> {
  const canvas = await html2canvas(element, {
    width: options?.width || 400,
    height: options?.height || 500,
    scale: options?.scale || 2,
    backgroundColor: '#ffffff',
    logging: false,
  })

  return canvas.toDataURL('image/png')
}

/**
 * Generate preview image from template config and design data
 * This creates a temporary DOM element, renders the template, and converts to image
 * NOTE: This function must be called from client-side code only
 */
export async function generateTemplatePreview(
  templateConfig: TemplateConfig,
  designData: DesignData,
  templateType: string = 'elegant'
): Promise<string> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('generateTemplatePreview can only be called from client-side code')
  }

  // Create a temporary container
  const container = document.createElement('div')
  container.style.width = '400px'
  container.style.height = '500px'
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.backgroundColor = designData.colors?.background || templateConfig.colors.background

  // Render template based on type
  const templateHTML = renderTemplateHTML(templateConfig, designData, templateType)
  container.innerHTML = templateHTML

  document.body.appendChild(container)

  try {
    const dataUrl = await generatePreviewFromElement(container, {
      width: 400,
      height: 500,
      scale: 2,
    })
    return dataUrl
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}

/**
 * Render template as HTML string
 */
function renderTemplateHTML(
  config: TemplateConfig,
  designData: DesignData,
  templateType: string
): string {
  const colors = { ...config.colors, ...designData.colors }
  const text = designData.text || {}

  // Base styles
  const styles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      .invitation {
        width: 100%;
        height: 100%;
        background: ${colors.background};
        color: ${colors.text};
        font-family: 'Georgia', 'Times New Roman', serif;
        display: flex;
        flex-direction: column;
        padding: 40px;
        position: relative;
        overflow: hidden;
      }
      .invitation h1 {
        color: ${colors.primary};
        font-size: 32px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 20px;
      }
      .invitation h2 {
        color: ${colors.heading || colors.primary};
        font-size: 24px;
        text-align: center;
        margin-bottom: 15px;
      }
      .invitation p {
        color: ${colors.body || colors.text};
        font-size: 16px;
        line-height: 1.6;
        text-align: center;
        margin-bottom: 10px;
      }
      .invitation .divider {
        width: 80px;
        height: 2px;
        background: ${colors.secondary};
        margin: 20px auto;
      }
      .invitation .decorative {
        position: absolute;
        width: 100px;
        height: 100px;
        border: 2px solid ${colors.accent || colors.secondary};
        opacity: 0.1;
      }
    </style>
  `

  // Render based on template type
  let content = ''
  
  switch (templateType) {
    case 'elegant':
    case 'wedding':
      content = renderElegantTemplate(config, text, colors)
      break
    case 'modern':
    case 'birthday':
      content = renderModernTemplate(config, text, colors)
      break
    case 'corporate':
      content = renderCorporateTemplate(config, text, colors)
      break
    default:
      content = renderDefaultTemplate(config, text, colors)
  }

  return styles + `<div class="invitation">${content}</div>`
}

function renderElegantTemplate(
  config: TemplateConfig,
  text: Record<string, string>,
  colors: Record<string, string>
): string {
  return `
    <div class="decorative" style="top: 20px; left: 20px; border-radius: 50%;"></div>
    <div class="decorative" style="bottom: 20px; right: 20px; border-radius: 50%;"></div>
    <h1>${text.bride_name || 'Bride'} & ${text.groom_name || 'Groom'}</h1>
    <div class="divider"></div>
    <h2>${text.date || 'Date'}</h2>
    <p>${text.venue || 'Venue'}</p>
    <div style="margin-top: 40px;">
      <p>${text.message || config.textFields.find(f => f.id === 'message')?.default || ''}</p>
    </div>
  `
}

function renderModernTemplate(
  config: TemplateConfig,
  text: Record<string, string>,
  colors: Record<string, string>
): string {
  return `
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h1 style="font-size: 48px; margin-bottom: 10px;">${text.name || 'Name'}</h1>
      ${text.age ? `<h2 style="font-size: 36px; color: ${colors.secondary};">${text.age} Years Old</h2>` : ''}
      <div class="divider"></div>
      <p style="font-size: 20px; margin-top: 20px;">${text.date || 'Date'}</p>
      <p>${text.venue || 'Venue'}</p>
      <p style="margin-top: 30px; font-style: italic;">${text.message || 'Join us for a celebration!'}</p>
    </div>
  `
}

function renderCorporateTemplate(
  config: TemplateConfig,
  text: Record<string, string>,
  colors: Record<string, string>
): string {
  return `
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
      <h1 style="border-bottom: 3px solid ${colors.primary}; padding-bottom: 15px; margin-bottom: 30px;">
        ${text.event_name || 'Event Name'}
      </h1>
      <div style="margin-bottom: 20px;">
        <p><strong>Date:</strong> ${text.date || 'Date'}</p>
        <p><strong>Time:</strong> ${text.time || 'Time'}</p>
        <p><strong>Venue:</strong> ${text.venue || 'Venue'}</p>
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${colors.secondary};">
        <p>${text.rsvp || 'Please RSVP by [date]'}</p>
      </div>
    </div>
  `
}

function renderDefaultTemplate(
  config: TemplateConfig,
  text: Record<string, string>,
  colors: Record<string, string>
): string {
  const titleField = config.textFields.find(f => f.id === 'title') || config.textFields[0]
  return `
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h1>${text[titleField?.id || 'title'] || 'Event Title'}</h1>
      <div class="divider"></div>
      <p>${text.date || 'Date'}</p>
      <p>${text.venue || 'Venue'}</p>
      <p style="margin-top: 30px;">${text.message || 'You are invited to join us!'}</p>
    </div>
  `
}

/**
 * Get Unsplash image URL for template backgrounds
 */
export function getUnsplashImageUrl(
  query: string,
  width: number = 400,
  height: number = 500
): string {
  // Using Unsplash Source API (no API key required for basic usage)
  // Format: https://source.unsplash.com/{width}x{height}/?{query}
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}`
}

/**
 * Get category-specific Unsplash queries
 */
export function getUnsplashQueryForCategory(category: string): string {
  const queries: Record<string, string> = {
    wedding: 'wedding invitation elegant',
    birthday: 'birthday party celebration',
    corporate: 'business professional event',
    celebration: 'celebration party festive',
    anniversary: 'anniversary romantic',
    graduation: 'graduation academic',
  }
  return queries[category] || 'invitation card'
}

