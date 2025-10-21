import type { ProcessingFile, ConversionResult, ProcessResult } from '~/types'

interface UseFileProcessorReturn {
  addFiles: (fileList: FileList | File[]) => Promise<void>
  removeFile: (fileId: string) => void
  clearFiles: () => void
  processAllFiles: (toast: any) => Promise<void>
}

/**
 * Track Google Analytics events for HDR conversion
 */
function trackGAAnalytics(eventName: string, parameters?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      custom_parameter_1: 'hdr_converter',
      ...parameters,
    })
  }
}

/**
 * Composable for managing file processing operations via API
 * Handles file upload, validation, API conversion, and state management
 */
export function useFileProcessor(): UseFileProcessorReturn {
  const filesStore = useFilesStore()
  const logsStore = useLogsStore()

  /**
   * Generate a unique file ID
   */
  const generateFileId = (): string => {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Format file size in human-readable format
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = (bytes / k ** i).toFixed(2)

    return `${size} ${sizes[i]}`
  }

  /**
   * Read file data as ArrayBuffer
   */
  const readFileData = async (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(e.target.result))
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'))
        }
      }

      reader.onerror = () => {
        reject(new Error('FileReader error'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Get image dimensions
   */
  const getImageDimensions = async (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Validate file is AVIF or JPEG
   */
  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/avif', 'image/jpeg', 'image/jpg']
    const validExtensions = ['.avif', '.jpg', '.jpeg']

    const hasValidType = validTypes.includes(file.type)
    const hasValidExtension = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    )

    return hasValidType || hasValidExtension
  }

  /**
   * Validate HDR status of file via API
   */
  const validateHDR = async (file: File): Promise<import('~/types').HdrValidationInfo> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await $fetch<import('~/types').HdrValidationInfo>('/api/validate-hdr', {
        method: 'POST',
        body: formData,
      })

      return response
    } catch (error: any) {
      return {
        isHDR: false,
        fileType: file.name.toLowerCase().endsWith('.avif') ? 'avif' : 'jpeg',
        details: `Validation failed: ${error.message}`,
      }
    }
  }

  /**
   * Add files to the processing queue
   */
  const addFiles = async (fileList: FileList | File[]): Promise<void> => {
    const fileArray = Array.from(fileList)
    logsStore.add(`Adding ${fileArray.length} file(s) to list...`, 'info')

    // Track file upload event
    trackGAAnalytics('file_upload_start', {
      file_count: fileArray.length,
      event_category: 'file_management',
    })

    const sizeWarnings: string[] = []
    const hdrWarnings: string[] = []

    for (const file of fileArray) {
      // Validate image file (AVIF or JPEG)
      if (!validateImageFile(file)) {
        logsStore.add(`✗ Skipped ${file.name}: Only AVIF and JPEG files are supported`, 'error')
        continue
      }

      const fileId = generateFileId()
      const fileObj: ProcessingFile = {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        data: null,
        status: 'pending',
        error: null,
        progress: 0,
        createdAt: Date.now(), // For analytics tracking
      }

      filesStore.addFile(fileObj)

      try {
        // Get image dimensions first
        const dimensions = await getImageDimensions(file)
        const maxDimension = Math.max(dimensions.width, dimensions.height)
        const sizeWarning = maxDimension > 1080

        filesStore.updateFile(fileId, {
          dimensions,
          sizeWarning,
        })

        if (sizeWarning) {
          logsStore.add(
            `⚠️ ${file.name}: ${dimensions.width}x${dimensions.height}px exceeds 1080px - Instagram may resize and remove HDR gain map!`,
            'warning'
          )
          sizeWarnings.push(file.name)
        } else {
          logsStore.add(
            `✓ ${file.name}: ${dimensions.width}x${dimensions.height}px (within Instagram limits)`,
            'info'
          )
        }

        // Validate HDR status
        logsStore.add(`Validating HDR status for ${file.name}...`, 'info')
        const hdrInfo = await validateHDR(file)

        filesStore.updateFile(fileId, {
          hdrInfo,
        })

        if (!hdrInfo.isHDR) {
          logsStore.add(
            `⚠️ ${file.name}: ${hdrInfo.details || 'Not an HDR image'} - Will not produce proper HDR output!`,
            'warning'
          )
          hdrWarnings.push(file.name)
        } else {
          logsStore.add(
            `✓ ${file.name}: ${hdrInfo.details || 'HDR image confirmed'}`,
            'success'
          )
        }

        // Load file data asynchronously
        const data = await readFileData(file)
        filesStore.updateFile(fileId, {
          data,
          status: 'ready'
        })
        logsStore.add(`✓ Loaded ${fileObj.name}: ${formatFileSize(data.length)}`, 'success')
      } catch (error: any) {
        filesStore.updateFile(fileId, {
          status: 'error',
          error: 'Failed to read file',
        })
        logsStore.add(`✗ Failed to load ${fileObj.name}: ${error.message}`, 'error')
      }
    }

    const toast = useToast()

    // Show warning summary if any files exceed size limits
    if (sizeWarnings.length > 0) {
      toast.add({
        title: 'Image Size Warning',
        description: `${sizeWarnings.length} image(s) exceed 1080px. Instagram may resize and remove HDR gain map.`,
        icon: 'i-lucide-alert-triangle',
        color: 'warning',
      })
    }

    // Show warning if any files are not HDR
    if (hdrWarnings.length > 0) {
      toast.add({
        title: 'Non-HDR Images Detected',
        description: `${hdrWarnings.length} image(s) are not HDR. Processing may not produce proper HDR output.`,
        icon: 'i-lucide-alert-circle',
        color: 'error',
      })
    }
  }

  /**
   * Remove a file from the queue
   */
  const removeFile = (fileId: string): void => {
    const filesStore = useFilesStore()
    const file = filesStore.files.find(f => f.id === fileId)

    if (file) {
      logsStore.add(`Removing file: ${file.name}`, 'info')
      filesStore.removeFile(fileId)
    }
  }

  /**
   * Clear all files from the queue
   */
  const clearFiles = (): void => {
    logsStore.add('Clearing all files...', 'info')
    filesStore.clearFiles()
  }

  /**
   * Convert base64 to blob URL
   */
  const base64ToBlob = (base64: string, mimeType: string): string => {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })
    return URL.createObjectURL(blob)
  }

  /**
   * Extract SDR image from JPG using canvas (browser decoding)
   * The browser automatically decodes the base (SDR) image
   */
  const extractSdrFromJpg = async (jpgBlob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(jpgBlob)

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            URL.revokeObjectURL(url)
            reject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0)

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url)
            if (blob) {
              resolve(URL.createObjectURL(blob))
            } else {
              reject(new Error('Failed to create blob'))
            }
          }, 'image/jpeg', 0.95)
        } catch (error) {
          URL.revokeObjectURL(url)
          reject(error)
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Process a single file via API
   */
  const processSingleFile = async (
    fileObj: ProcessingFile,
    index: number,
    total: number,
  ): Promise<void> => {
    if (!fileObj.data) {
      throw new Error('File not loaded')
    }

    logsStore.add(`[${index + 1}/${total}] 📸 Processing: ${fileObj.name}`, 'info')
    filesStore.updateFile(fileObj.id, {
      status: 'processing',
      progress: 0,
    })

    try {
      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', fileObj.file)

      logsStore.add(`Uploading ${fileObj.name} to API...`, 'info')
      filesStore.updateFile(fileObj.id, { progress: 10 })

      // Call API endpoint
      const response = await $fetch<ConversionResult>('/api/convert', {
        method: 'POST',
        body: formData,
      })

      // Log API logs
      if (response.logs) {
        response.logs.forEach(log => logsStore.add(log, 'info'))
      }

      if (!response.success || !response.outputJpg) {
        throw new Error(response.error || 'Conversion failed')
      }

      logsStore.add('Conversion completed, processing results...', 'success')
      filesStore.updateFile(fileObj.id, { progress: 80 })

      // Convert base64 results to blob URLs
      const finalJpgBlob = base64ToBlob(response.outputJpg, 'image/jpeg')
      const originalAvifUrl = URL.createObjectURL(fileObj.file)

      // Extract or use provided SDR image
      let sdrImageUrl: string
      if (response.sdrImage) {
        sdrImageUrl = base64ToBlob(response.sdrImage, 'image/jpeg')
        logsStore.add('Using server-extracted SDR image', 'info')
      } else {
        // Extract SDR from final JPG using browser
        logsStore.add('Extracting SDR image using browser decoder...', 'info')
        const jpgBlob = await fetch(finalJpgBlob).then(r => r.blob())
        sdrImageUrl = await extractSdrFromJpg(jpgBlob)
      }

      // Use provided gain map or placeholder
      let gainMapUrl: string
      if (response.gainMap) {
        gainMapUrl = base64ToBlob(response.gainMap, 'image/jpeg')
        logsStore.add('Using server-extracted gain map', 'info')
      } else {
        // Create placeholder or empty image
        gainMapUrl = ''
        logsStore.add('Gain map not available from server', 'warning')
      }

      const result: ProcessResult = {
        success: true,
        originalImage: originalAvifUrl,
        finalJpg: finalJpgBlob,
        sdrImage: sdrImageUrl,
        gainMapImage: gainMapUrl,
        originalSize: fileObj.size,
        processedSize: Math.round(response.outputJpg.length * 0.75), // Approximate from base64
        metadata: response.metadata,
      }

      filesStore.updateFile(fileObj.id, {
        status: 'completed',
        progress: 100,
        result,
      })

      // Track successful conversion
      trackGAAnalytics('hdr_conversion_success', {
        file_type: fileObj.name.toLowerCase().includes('.avif') ? 'avif' : 'jpeg',
        file_size: Math.round(fileObj.size / 1024), // KB
        conversion_time: Date.now() - (fileObj.createdAt || Date.now()),
        event_category: 'hdr_conversion',
        value: 1,
      })

      logsStore.add(`[${index + 1}/${total}] ✅ Completed: ${fileObj.name}`, 'success')
    } catch (error: any) {
      const errorMsg = error?.message || error?.data?.message || 'Unknown error'
      logsStore.add(`✗ Error processing ${fileObj.name}: ${errorMsg}`, 'error')

      filesStore.updateFile(fileObj.id, {
        status: 'error',
        error: errorMsg,
        progress: 0,
      })

      // Track conversion error
      trackGAAnalytics('hdr_conversion_error', {
        file_type: fileObj.name.toLowerCase().includes('.avif') ? 'avif' : 'jpeg',
        error_message: errorMsg.substring(0, 100), // Limit error message length
        event_category: 'hdr_conversion',
      })

      throw error
    }
  }

  /**
   * Process all files in the queue
   */
  const processAllFiles = async (toast: any): Promise<void> => {
    const filesStore = useFilesStore()

    if (filesStore.files.length === 0) {
      logsStore.add('No files selected', 'error')
      toast.add({
        title: 'No Files',
        description: 'Please upload AVIF files first',
        icon: 'i-lucide-alert-circle',
        color: 'warning',
      })
      return
    }

    const readyFiles = filesStore.files.filter(f => f.status === 'ready')
    if (readyFiles.length === 0) {
      logsStore.add('No files ready for processing', 'error')
      toast.add({
        title: 'No Ready Files',
        description: 'All files are either pending, processing, or completed',
        icon: 'i-lucide-alert-circle',
        color: 'warning',
      })
      return
    }

    logsStore.add('=== Starting Batch Processing ===', 'info')
    logsStore.add(`Processing ${readyFiles.length} file(s)...`, 'info')

    // Track batch processing start
    trackGAAnalytics('batch_conversion_start', {
      file_count: readyFiles.length,
      event_category: 'hdr_conversion',
    })

    filesStore.setProcessing(true)
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < readyFiles.length; i++) {
      const fileObj = readyFiles[i]
      if (!fileObj) continue

      try {
        await processSingleFile(fileObj, i, readyFiles.length)
        successCount++
      } catch (error) {
        errorCount++
      }
    }

    logsStore.add('=== Batch Processing Complete ===', 'success')
    logsStore.add(`✓ Success: ${successCount} file(s)`, 'success')

    if (errorCount > 0) {
      logsStore.add(`✗ Errors: ${errorCount} file(s)`, 'error')
    }

    // Track batch completion
    trackGAAnalytics('batch_conversion_complete', {
      total_files: readyFiles.length,
      successful_conversions: successCount,
      failed_conversions: errorCount,
      success_rate: Math.round((successCount / readyFiles.length) * 100),
      event_category: 'hdr_conversion',
      value: successCount,
    })

    toast.add({
      title: 'Processing Complete',
      description: `${successCount} files processed successfully${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
      icon: 'i-lucide-check-circle',
      color: errorCount > 0 ? 'warning' : 'success',
    })

    filesStore.setProcessing(false)
  }

  return {
    addFiles,
    removeFile,
    clearFiles,
    processAllFiles,
  }
}
