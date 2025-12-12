import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check if auth environment variables are accessible
 * DELETE THIS FILE AFTER DEBUGGING
 */
export async function GET() {
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  
  return NextResponse.json({
    hasAUTH_SECRET: !!process.env.AUTH_SECRET,
    hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    hasAUTH_URL: !!process.env.AUTH_URL,
    hasNEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    hasSecret: !!authSecret,
    secretLength: authSecret?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    // Don't expose actual values for security
  })
}

