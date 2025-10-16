/**
 * Download Utilities
 * Helper functions for downloading processed images
 */

import type { ProcessingFile } from '~/types'
import JSZip from 'jszip'

/**
 * Download a single image from data URL
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Convert data URL or blob URL to Blob
 */
async function urlToBlob(url: string): Promise<Blob> {
  // If it's a blob URL, fetch it directly
  if (url.startsWith('blob:')) {
    const response = await fetch(url)
    return response.blob()
  }

  // If it's a data URL, convert it
  if (url.startsWith('data:')) {
    const arr = url.split(',')
    const mimeMatch = arr[0]?.match(/:(.*?);/)
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
    const base64 = arr[1]

    if (!base64) {
      throw new Error('Invalid data URL')
    }

    const bstr = atob(base64)
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  throw new Error('Unsupported URL format. Expected blob: or data: URL')
}

/**
 * Download all processed images as a ZIP file
 */
export async function downloadAllImages(files: ProcessingFile[]): Promise<void> {
  const completedFiles = files.filter(f => f.status === 'completed' && f.result)

  if (completedFiles.length === 0) {
    throw new Error('No completed files to download')
  }

  const zip = new JSZip()

  // Add each processed image to the zip
  for (const file of completedFiles) {
    if (!file.result?.afterImage)
      continue

    const blob = await urlToBlob(file.result.afterImage)
    const baseName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
    const filename = `${baseName}_processed.jpg`
    zip.file(filename, blob)
  }

  // Generate and download the zip file
  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const link = document.createElement('a')
  link.href = url
  link.download = `hdr-processed-images-${Date.now()}.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
