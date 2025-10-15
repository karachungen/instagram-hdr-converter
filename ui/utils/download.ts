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
 * Convert data URL to Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',')
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
  completedFiles.forEach((file) => {
    if (!file.result?.afterImage)
      return

    const blob = dataUrlToBlob(file.result.afterImage)
    const baseName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
    const filename = `${baseName}_processed.jpg`
    zip.file(filename, blob)
  })

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
