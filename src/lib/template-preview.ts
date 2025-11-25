/**
 * Template Preview Generator
 * 
 * Generates reliable preview images for invitation templates
 * Uses SVG placeholders instead of external APIs for better performance
 */

export interface PreviewOptions {
  width?: number
  height?: number
  category?: string
  name?: string
}

/**
 * Generate an SVG placeholder for template preview
 * This is fast, reliable, and doesn't require external APIs
 */
export function generateSVGPreview(options: PreviewOptions = {}): string {
  const width = options.width || 400
  const height = options.height || 500
  const category = options.category || 'celebration'
  const name = options.name || 'Template'

  // Color schemes by category
  const colorSchemes: Record<string, { primary: string; secondary: string; accent: string }> = {
    wedding: { primary: '#9333ea', secondary: '#ec4899', accent: '#f3e8ff' },
    birthday: { primary: '#f59e0b', secondary: '#ef4444', accent: '#fef3c7' },
    corporate: { primary: '#1e40af', secondary: '#3b82f6', accent: '#dbeafe' },
    celebration: { primary: '#10b981', secondary: '#34d399', accent: '#d1fae5' },
    anniversary: { primary: '#be185d', secondary: '#ec4899', accent: '#fce7f3' },
    graduation: { primary: '#1e3a8a', secondary: '#3b82f6', accent: '#dbeafe' },
  }

  const colors = colorSchemes[category] || colorSchemes.celebration

  // Create SVG with gradient and text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="${colors.accent}" opacity="0.3" rx="8" />
      <text x="50%" y="45%" text-anchor="middle" fill="${colors.primary}" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${name}</text>
      <text x="50%" y="55%" text-anchor="middle" fill="${colors.secondary}" font-family="Arial, sans-serif" font-size="14" opacity="0.8">${category}</text>
    </svg>
  `.trim()

  // Convert SVG to data URL (URL-encoded for browser compatibility)
  const encodedSvg = encodeURIComponent(svg)
  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`
}

/**
 * Generate a data URL for template preview
 * This can be used directly in img src attributes
 */
export function getTemplatePreviewDataURL(options: PreviewOptions): string {
  return generateSVGPreview(options)
}

/**
 * Get category-specific preview colors
 */
export function getCategoryColors(category: string): { primary: string; secondary: string; accent: string } {
  const colorSchemes: Record<string, { primary: string; secondary: string; accent: string }> = {
    wedding: { primary: '#9333ea', secondary: '#ec4899', accent: '#f3e8ff' },
    birthday: { primary: '#f59e0b', secondary: '#ef4444', accent: '#fef3c7' },
    corporate: { primary: '#1e40af', secondary: '#3b82f6', accent: '#dbeafe' },
    celebration: { primary: '#10b981', secondary: '#34d399', accent: '#d1fae5' },
    anniversary: { primary: '#be185d', secondary: '#ec4899', accent: '#fce7f3' },
    graduation: { primary: '#1e3a8a', secondary: '#3b82f6', accent: '#dbeafe' },
  }
  return colorSchemes[category] || colorSchemes.celebration
}

