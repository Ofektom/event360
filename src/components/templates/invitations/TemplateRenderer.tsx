'use client'

import React from 'react'
import { ElegantWeddingTemplate } from './ElegantWeddingTemplate'
import { ModernBirthdayTemplate } from './ModernBirthdayTemplate'
import { CorporateEventTemplate } from './CorporateEventTemplate'
import { CelebrationTemplate } from './CelebrationTemplate'
import { BlankTemplate } from './BlankTemplate'

interface TemplateRendererProps {
  templateType: string
  config?: {
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
  ref?: React.Ref<HTMLDivElement>
}

export const TemplateRenderer = React.forwardRef<HTMLDivElement, TemplateRendererProps>(
  ({ templateType, config, designData }, ref) => {
    // If no config or blank template, use BlankTemplate
    if (!config || templateType === 'blank' || templateType === 'Blank Template') {
      return (
        <div ref={ref}>
          <BlankTemplate config={config} designData={designData} />
        </div>
      )
    }

    // Map template names to components
    const templateMap: Record<string, React.ComponentType<any>> = {
      'Elegant Wedding': ElegantWeddingTemplate,
      elegant: ElegantWeddingTemplate,
      wedding: ElegantWeddingTemplate,
      'Modern Birthday': ModernBirthdayTemplate,
      modern: ModernBirthdayTemplate,
      birthday: ModernBirthdayTemplate,
      'Corporate Event': CorporateEventTemplate,
      corporate: CorporateEventTemplate,
      Celebration: CelebrationTemplate,
      celebration: CelebrationTemplate,
    }

    const TemplateComponent =
      templateMap[templateType] || templateMap[config.textFields?.[0]?.label] || CelebrationTemplate

    return (
      <div ref={ref}>
        <TemplateComponent config={config} designData={designData} />
      </div>
    )
  }
)

TemplateRenderer.displayName = 'TemplateRenderer'

