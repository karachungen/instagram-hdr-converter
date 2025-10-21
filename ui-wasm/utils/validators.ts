/**
 * Utility functions for validation
 */

/**
 * Validate if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  file: File,
  maxWidth?: number,
  maxHeight?: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const isValidWidth = maxWidth ? img.width <= maxWidth : true
      const isValidHeight = maxHeight ? img.height <= maxHeight : true

      resolve(isValidWidth && isValidHeight)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(false)
    }

    img.src = url
  })
}

/**
 * Get supported image types
 */
export function getSupportedImageTypes(): string[] {
  return [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heif',
    'image/heic',
    'image/avif',
    'image/webp',
  ]
}

/**
 * Check if file type is supported
 */
export function isSupportedImageType(file: File): boolean {
  return getSupportedImageTypes().includes(file.type.toLowerCase())
}
