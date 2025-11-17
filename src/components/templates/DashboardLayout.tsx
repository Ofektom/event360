'use client'

import { ReactNode } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar variant="dashboard" />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer variant="dashboard" />
    </div>
  )
}

