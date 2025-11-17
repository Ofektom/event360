'use client'

import { ReactNode } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemeConfig } from '@/types/theme.types'

interface PublicEventLayoutProps {
  children: ReactNode
  theme?: ThemeConfig
}

export function PublicEventLayout({ children, theme }: PublicEventLayoutProps) {
  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme?.colors.background || '#ffffff' }}>
        <Navbar variant="public" />
        <main className="flex-1">
          {children}
        </main>
        <Footer variant="public" />
      </div>
    </ThemeProvider>
  )
}

