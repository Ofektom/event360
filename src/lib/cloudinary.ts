/**
 * Cloudinary Utility
 * Handles image and media uploads to Cloudinary
 */

import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

// Configure Cloudinary
// Supports both CLOUDINARY_URL format and individual environment variables
// CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
if (process.env.CLOUDINARY_URL) {
  // Use CLOUDINARY_URL if provided (Cloudinary SDK automatically parses it)
  cloudinary.config(process.env.CLOUDINARY_URL)
} else {
  // Use individual environment variables
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

interface UploadOptions {
  folder?: string
  resourceType?: 'image' | 'video' | 'raw' | 'auto'
  publicId?: string
  overwrite?: boolean
  transformation?: any[]
}

/**
 * Upload a buffer to Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<{ url: string; publicId: string; secureUrl: string }> {
  const {
    folder = 'event360',
    resourceType = 'auto',
    publicId,
    overwrite = true,
    transformation,
  } = options

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        overwrite,
        transformation,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          reject(error)
        } else if (result) {
          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
          })
        } else {
          reject(new Error('Upload failed: No result returned'))
        }
      }
    )

    // Convert buffer to stream
    const bufferStream = new Readable()
    bufferStream.push(buffer)
    bufferStream.push(null) // End the stream

    bufferStream.pipe(uploadStream)
  })
}

/**
 * Upload a file from a data URL (base64) to Cloudinary
 */
export async function uploadDataUrlToCloudinary(
  dataUrl: string,
  options: UploadOptions = {}
): Promise<{ url: string; publicId: string; secureUrl: string }> {
  // Extract base64 data from data URL
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid data URL format')
  }

  const mimeType = matches[1]
  const base64Data = matches[2]

  // Determine resource type from MIME type
  let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
  if (mimeType.startsWith('image/')) {
    resourceType = 'image'
  } else if (mimeType.startsWith('video/')) {
    resourceType = 'video'
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUrl,
      {
        ...options,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          reject(error)
        } else if (result) {
          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
          })
        } else {
          reject(new Error('Upload failed: No result returned'))
        }
      }
    )
  })
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  // Check for CLOUDINARY_URL or individual environment variables
  return !!(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
     process.env.CLOUDINARY_API_KEY &&
     process.env.CLOUDINARY_API_SECRET)
  )
}

/**
 * Delete an image from Cloudinary by public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error('Cloudinary delete error:', error)
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

