import { NextRequest, NextResponse } from 'next/server'

/**
 * Debug endpoint to check EmailJS configuration
 * This helps verify environment variables are loaded correctly
 */
export async function GET(request: NextRequest) {
  try {
    const serviceId = process.env.EMAILJS_SERVICE_ID?.trim()
    const templateId = process.env.EMAILJS_TEMPLATE_ID?.trim()
    const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim()
    const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim()

    return NextResponse.json({
      configured: {
        hasServiceId: !!serviceId,
        hasTemplateId: !!templateId,
        hasPublicKey: !!publicKey,
        hasPrivateKey: !!privateKey,
      },
      values: {
        serviceId: serviceId || 'NOT SET',
        templateId: templateId || 'NOT SET',
        publicKey: publicKey 
          ? `${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 4)} (length: ${publicKey.length})`
          : 'NOT SET',
        privateKey: privateKey
          ? `${privateKey.substring(0, 6)}...${privateKey.substring(privateKey.length - 4)} (length: ${privateKey.length})`
          : 'NOT SET',
      },
      expectedFormat: {
        publicKey: 'Should start with letters/numbers, typically 16-20 characters',
        privateKey: 'Should start with "mg_" or similar, typically 20+ characters',
        serviceId: 'Should start with "service_", e.g., "service_xxxxx"',
        templateId: 'Should start with "template_", e.g., "template_xxxxx"',
      },
      recommendation: privateKey
        ? 'Using PRIVATE_KEY - user_id should be the private key value'
        : 'Using PUBLIC_KEY - user_id should be the public key value',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check configuration' },
      { status: 500 }
    )
  }
}

