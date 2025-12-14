'use client'

import { useEffect } from 'react'

/**
 * Mobile Responsiveness Fix Component
 * 
 * This component ensures mobile responsiveness is maintained after page load
 * by preventing common issues that break mobile layouts:
 * - Prevents horizontal scrolling
 * - Maintains viewport width
 * - Prevents layout shifts
 */
export function MobileResponsivenessFix() {
  useEffect(() => {
    // Prevent horizontal scroll
    const preventHorizontalScroll = () => {
      document.documentElement.style.overflowX = 'hidden'
      document.body.style.overflowX = 'hidden'
      document.documentElement.style.width = '100%'
      document.body.style.width = '100%'
      document.documentElement.style.maxWidth = '100vw'
      document.body.style.maxWidth = '100vw'
    }

    // Set initial styles
    preventHorizontalScroll()

    // Re-apply on resize to prevent layout breaks
    const handleResize = () => {
      preventHorizontalScroll()
      
      // Ensure viewport meta tag is respected
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        const content = viewport.getAttribute('content') || ''
        if (!content.includes('width=device-width')) {
          viewport.setAttribute(
            'content',
            'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover'
          )
        }
      }
    }

    // Handle orientation change
    const handleOrientationChange = () => {
      setTimeout(() => {
        preventHorizontalScroll()
        handleResize()
      }, 100)
    }

    // Add event listeners
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
    
    // Also listen for scroll events to prevent horizontal scroll
    const handleScroll = () => {
      if (window.scrollX !== 0) {
        window.scrollTo(0, window.scrollY)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return null
}

