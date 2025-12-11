/**
 * Cloudinary URL Transformation Utilities
 * Generates optimized image URLs using Cloudinary transformations
 */

/**
 * Generate an optimized thumbnail URL from a Cloudinary URL
 * @param url - Original Cloudinary URL
 * @param width - Desired width (default: 400)
 * @param height - Desired height (default: 400)
 * @param quality - Image quality (default: 'auto')
 * @param format - Image format (default: 'auto' for WebP when supported)
 */
export function getOptimizedThumbnailUrl(
  url: string,
  width: number = 400,
  height: number = 400,
  quality: string | number = 'auto',
  format: string = 'auto'
): string {
  // If not a Cloudinary URL, return as-is
  if (!url || !url.includes('cloudinary.com')) {
    return url
  }

  // Check if URL already has transformations
  if (url.includes('/upload/')) {
    const parts = url.split('/upload/')
    if (parts.length === 2) {
      // Insert transformation parameters
      const transformation = `w_${width},h_${height},c_fill,q_${quality},f_${format}`
      return `${parts[0]}/upload/${transformation}/${parts[1]}`
    }
  }

  // Fallback: return original URL
  return url
}

/**
 * Generate an optimized image URL for gallery thumbnails
 * Uses smaller dimensions and auto quality/format for fast loading
 */
export function getGalleryThumbnailUrl(url: string): string {
  return getOptimizedThumbnailUrl(url, 300, 300, 'auto', 'auto')
}

/**
 * Generate an optimized image URL for full-size display
 * Uses larger dimensions but still optimized
 */
export function getOptimizedImageUrl(url: string, maxWidth: number = 1200): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url
  }

  if (url.includes('/upload/')) {
    const parts = url.split('/upload/')
    if (parts.length === 2) {
      const transformation = `w_${maxWidth},q_auto,f_auto`
      return `${parts[0]}/upload/${transformation}/${parts[1]}`
    }
  }

  return url
}

