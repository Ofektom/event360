// Theme types for event customization
export interface EventTheme {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  accentColor: string
  fontFamily?: string
  borderRadius?: string
  spacing?: string
}

export interface ThemeConfig {
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    accent: string
  }
  typography: {
    fontFamily?: string
    headingFont?: string
  }
  spacing: {
    base: string
    small: string
    medium: string
    large: string
  }
  borderRadius: {
    small: string
    medium: string
    large: string
  }
}

// Default theme
export const defaultTheme: ThemeConfig = {
  colors: {
    primary: '#9333ea', // purple-600
    secondary: '#ec4899', // pink-500
    background: '#ffffff',
    text: '#111827', // gray-900
    accent: '#f3f4f6', // gray-100
  },
  typography: {
    fontFamily: 'var(--font-geist-sans)',
    headingFont: 'var(--font-geist-sans)',
  },
  spacing: {
    base: '1rem',
    small: '0.5rem',
    medium: '1.5rem',
    large: '2rem',
  },
  borderRadius: {
    small: '0.5rem',
    medium: '1rem',
    large: '1.5rem',
  },
}

