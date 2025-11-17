'use client'

import { createContext, useContext, ReactNode } from 'react'
import { ThemeConfig, defaultTheme } from '@/types/theme.types'

interface ThemeContextType {
  theme: ThemeConfig
  updateTheme: (theme: Partial<ThemeConfig>) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  theme = defaultTheme,
  children,
}: {
  theme?: ThemeConfig
  children: ReactNode
}) {
  const updateTheme = (newTheme: Partial<ThemeConfig>) => {
    // This would typically update the theme in the database
    // For now, we'll just merge with existing theme
    Object.assign(theme, newTheme)
  }

  // Apply CSS variables to the document
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    root.style.setProperty('--theme-primary', theme.colors.primary)
    root.style.setProperty('--theme-secondary', theme.colors.secondary)
    root.style.setProperty('--theme-background', theme.colors.background)
    root.style.setProperty('--theme-text', theme.colors.text)
    root.style.setProperty('--theme-accent', theme.colors.accent)
    root.style.setProperty('--theme-font', theme.typography.fontFamily || 'inherit')
    root.style.setProperty('--theme-spacing-base', theme.spacing.base)
    root.style.setProperty('--theme-border-radius', theme.borderRadius.medium)
  }

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      <div
        style={
          {
            '--theme-primary': theme.colors.primary,
            '--theme-secondary': theme.colors.secondary,
            '--theme-background': theme.colors.background,
            '--theme-text': theme.colors.text,
            '--theme-accent': theme.colors.accent,
          } as React.CSSProperties
        }
        className="min-h-screen"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

