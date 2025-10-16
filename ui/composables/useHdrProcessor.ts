/**
 * HDR Image Processing Service
 * Handles two-step HDR conversion process with metadata extraction
 */

import type { HdrMetadata, WasmModule } from '~/types'

export interface ProcessingStep {
  step: 'decode' | 'encode'
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  message: string
  progress?: number
}

export interface HdrProcessResult {
  success: boolean
  beforeImage: string // Data URL of original image
  afterImage: string // Data URL of processed image
  originalSize: number
  processedSize: number
  width: number
  height: number
  metadataOriginal?: HdrMetadata
  metadataProcessed?: HdrMetadata
  error?: string
}

export function useHdrProcessor() {
  const logsStore = useLogsStore()

  /**
   * Format metadata for display in logs
   */
  function formatMetadata(metadata: HdrMetadata): string {
    const formatValues = (values: number | number[]): string => {
      const arr = Array.isArray(values) ? values : [values]
      return arr.length > 1 ? arr.join(' ') : String(arr[0])
    }

    return `
    Max Content Boost: ${formatValues(metadata.maxContentBoost)}
    Min Content Boost: ${formatValues(metadata.minContentBoost)}
    Gamma: ${formatValues(metadata.gamma)}
    Offset SDR: ${formatValues(metadata.offsetSdr)}
    Offset HDR: ${formatValues(metadata.offsetHdr)}
    HDR Capacity Min: ${metadata.hdrCapacityMin}
    HDR Capacity Max: ${metadata.hdrCapacityMax}
    Use Base Color Space: ${metadata.useBaseColorSpace}`
  }

  /**
   * Parse HDR metadata from file content
   */
  function parseHdrMetadata(metadataContent: string): HdrMetadata | null {
    try {
      const lines = metadataContent.split('\n')
      const metadata: any = {}

      // Fields that can have multiple values (RGB channels)
      const arrayFields = ['maxContentBoost', 'minContentBoost', 'gamma', 'offsetSdr', 'offsetHdr']

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#'))
          continue

        const match = trimmed.match(/--(\w+)\s+(.+)/)
        if (match && match[1] && match[2]) {
          const key = match[1]
          const valueString = match[2].trim()

          if (arrayFields.includes(key)) {
            // Parse multiple space-separated values
            const values = valueString.split(/\s+/).map(v => Number.parseFloat(v))
            metadata[key] = values
          }
          else {
            // Single value
            metadata[key] = Number.parseFloat(valueString)
          }
        }
      }

      // Validate all required fields exist
      const required = [
        'maxContentBoost',
        'minContentBoost',
        'gamma',
        'offsetSdr',
        'offsetHdr',
        'hdrCapacityMin',
        'hdrCapacityMax',
        'useBaseColorSpace',
      ]

      for (const field of required) {
        if (!(field in metadata)) {
          logsStore.add(`Missing required metadata field: ${field}`, 'warning')
          return null
        }
      }

      // Ensure array fields are arrays (even if single value)
      for (const field of arrayFields) {
        if (field in metadata && !Array.isArray(metadata[field])) {
          metadata[field] = [metadata[field]]
        }
      }

      return metadata as HdrMetadata
    }
    catch (error) {
      logsStore.add(`Failed to parse metadata: ${error}`, 'error')
      return null
    }
  }

  /**
   * Get image dimensions from file
   */
  async function getImageDimensions(file: File): Promise<{ width: number, height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        const dimensions = { width: img.width, height: img.height }
        URL.revokeObjectURL(url)
        resolve(dimensions)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Step 1: Decode HDR to RAW (with fresh WASM module) and extract metadata
   * Command: ultrahdr_app -m 1 -j image.jpg -z image.raw -f metadata.cfg
   */
  async function decodeHdrToRaw(
    inputData: Uint8Array,
    inputPath: string,
    outputPath: string,
    metadataPath: string,
    onProgress: (step: ProcessingStep) => void,
  ): Promise<{ rawData: Uint8Array, metadata: HdrMetadata | null }> {
    onProgress({
      step: 'decode',
      status: 'in_progress',
      message: 'Decoding HDR image to RAW format...',
      progress: 0,
    })

    logsStore.add(`[HDR Decode] Starting: ${inputPath} → ${outputPath}`, 'info')

    const { reinitWasm } = useWasm()

    try {
      // Create fresh WASM module for decode
      logsStore.add('[HDR Decode] Creating fresh WASM instance...', 'info')
      const freshModule = await reinitWasm()

      // Write input file to fresh FS
      freshModule.FS.writeFile(inputPath, inputData)
      console.log('[FS] Wrote input file:', inputPath)

      // Run decode command with metadata extraction
      const decodeArgs = ['-m', '1', '-j', inputPath, '-z', outputPath, '-f', metadataPath]
      logsStore.add(`[HDR Decode] Calling: ultrahdr_app ${decodeArgs.join(' ')}`, 'info')
      console.log('[WASM CMD] Decode:', decodeArgs)

      if (freshModule.callMain) {
        const result = freshModule.callMain(decodeArgs)
        console.log('[WASM RESULT] Decode returned:', result)
        logsStore.add(`[HDR Decode] Command returned: ${result}`, 'info')
      }

      // Read RAW output from FS and save to browser memory
      const rawData = freshModule.FS.readFile(outputPath)
      console.log('[FS] Read RAW from FS, size:', rawData.length)
      logsStore.add(`[HDR Decode] Success: RAW data (${rawData.length} bytes)`, 'success')

      // Read and parse metadata file
      let metadata: HdrMetadata | null = null
      try {
        const metadataData = freshModule.FS.readFile(metadataPath)
        const metadataText = new TextDecoder().decode(metadataData)
        console.log('[FS] Read metadata file:', metadataPath)
        logsStore.add(`[HDR Decode] Metadata extracted (${metadataData.length} bytes)`, 'info')

        metadata = parseHdrMetadata(metadataText)
        if (metadata) {
          logsStore.add('[HDR Decode] ✓ Original Metadata:', 'success')
          logsStore.add(formatMetadata(metadata), 'info')
          console.log('[Metadata]:', metadata)
        }
      }
      catch (error) {
        logsStore.add(`[HDR Decode] Warning: Could not read metadata file: ${error}`, 'warning')
      }

      onProgress({
        step: 'decode',
        status: 'completed',
        message: 'HDR decoded successfully',
        progress: 100,
      })

      return { rawData, metadata }
    }
    catch (error) {
      const err = error as Error
      const errorMsg = err?.message || String(error)
      logsStore.add(`[HDR Decode] Error: ${errorMsg}`, 'error')
      onProgress({
        step: 'decode',
        status: 'error',
        message: errorMsg,
      })
      throw err
    }
  }

  /**
   * Extract metadata from processed image
   * Command: ultrahdr_app -m 1 -j processed.jpg -z temp.raw -f metadata.cfg
   */
  async function extractMetadataFromProcessed(
    processedData: Uint8Array,
    inputPath: string,
    rawPath: string,
    metadataPath: string,
  ): Promise<HdrMetadata | null> {
    logsStore.add('[HDR Verify] Extracting metadata from processed image...', 'info')

    const { reinitWasm } = useWasm()

    try {
      // Create fresh WASM module for metadata extraction
      const freshModule = await reinitWasm()

      // Write processed image to FS
      freshModule.FS.writeFile(inputPath, processedData)
      console.log('[FS] Wrote processed image for metadata extraction:', inputPath)

      // Run decode command to extract metadata only
      const decodeArgs = ['-m', '1', '-j', inputPath, '-z', rawPath, '-f', metadataPath]
      console.log('[WASM CMD] Extract metadata:', decodeArgs)

      if (freshModule.callMain) {
        const result = freshModule.callMain(decodeArgs)
        console.log('[WASM RESULT] Metadata extraction returned:', result)
      }

      // Read and parse metadata file
      const metadataData = freshModule.FS.readFile(metadataPath)
      const metadataText = new TextDecoder().decode(metadataData)
      console.log('[FS] Read processed metadata file:', metadataPath)

      const metadata = parseHdrMetadata(metadataText)
      if (metadata) {
        logsStore.add('[HDR Verify] ✓ Processed Image Metadata:', 'success')
        logsStore.add(formatMetadata(metadata), 'info')
        console.log('[Processed Metadata]:', metadata)
      }

      return metadata
    }
    catch (error) {
      logsStore.add(`[HDR Verify] Warning: Could not extract processed metadata: ${error}`, 'warning')
      return null
    }
  }

  /**
   * Step 2: Encode RAW to HDR (with fresh WASM module) using metadata
   * Command: ultrahdr_app -m 0 -p image.raw -w 1080 -h 1080 -f metadata.cfg
   */
  async function encodeRawToHdr(
    rawData: Uint8Array,
    inputPath: string,
    outputPath: string,
    width: number,
    height: number,
    metadata: HdrMetadata | null,
    metadataPath: string,
    onProgress: (step: ProcessingStep) => void,
  ): Promise<Uint8Array> {
    onProgress({
      step: 'encode',
      status: 'in_progress',
      message: `Encoding RAW to HDR (${width}x${height})...`,
      progress: 0,
    })

    logsStore.add(`[HDR Encode] Starting: ${inputPath} → ${outputPath} (${width}x${height})`, 'info')

    const { reinitWasm } = useWasm()

    try {
      // Create fresh WASM module for encode
      logsStore.add('[HDR Encode] Creating fresh WASM instance...', 'info')
      const freshModule = await reinitWasm()

      // Write RAW file from browser memory to fresh FS
      freshModule.FS.writeFile(inputPath, rawData)
      console.log('[FS] Wrote RAW file to fresh FS:', inputPath, 'size:', rawData.length)
      logsStore.add(`[HDR Encode] RAW file restored: ${rawData.length} bytes`, 'info')

      // Write metadata file if available
      if (metadata) {
        const formatValue = (value: number | number[]): string => {
          return Array.isArray(value) ? value.join(' ') : String(value)
        }

        const metadataContent = `--maxContentBoost ${formatValue(metadata.maxContentBoost)}
--minContentBoost ${formatValue(metadata.minContentBoost)}
--gamma ${formatValue(metadata.gamma)}
--offsetSdr ${formatValue(metadata.offsetSdr)}
--offsetHdr ${formatValue(metadata.offsetHdr)}
--hdrCapacityMin ${metadata.hdrCapacityMin}
--hdrCapacityMax ${metadata.hdrCapacityMax}
--useBaseColorSpace ${metadata.useBaseColorSpace}`

        const metadataBytes = new TextEncoder().encode(metadataContent)
        freshModule.FS.writeFile(metadataPath, metadataBytes)
        console.log('[FS] Wrote metadata file to fresh FS:', metadataPath)
        logsStore.add('[HDR Encode] Metadata file written', 'info')
      }

      // Run encode command with or without metadata
      const encodeArgs = [
        '-m',
        '0',
        '-p',
        inputPath,
        '-w',
        String(width),
        '-h',
        String(height),
        '-z',
        outputPath,
      ]

      // Add metadata flag if available
      if (metadata) {
        encodeArgs.push('-f', metadataPath)
        logsStore.add('[HDR Encode] Using original HDR metadata', 'info')
      }

      logsStore.add(`[HDR Encode] Calling: ultrahdr_app ${encodeArgs.join(' ')}`, 'info')
      console.log('[WASM CMD] Encode:', encodeArgs)

      if (freshModule.callMain) {
        const result = freshModule.callMain(encodeArgs)
        console.log('[WASM RESULT] Encode returned:', result)
        logsStore.add(`[HDR Encode] Command returned: ${result}`, 'info')
      }

      // Read output from FS and save to browser memory
      const outputData = freshModule.FS.readFile(outputPath)
      console.log('[FS] Read output from FS, size:', outputData.length)
      logsStore.add(`[HDR Encode] Success: output data (${outputData.length} bytes)`, 'success')

      onProgress({
        step: 'encode',
        status: 'completed',
        message: 'HDR encoded successfully',
        progress: 100,
      })

      return outputData
    }
    catch (error) {
      const err = error as Error
      const errorMsg = err?.message || String(error)
      logsStore.add(`[HDR Encode] Error: ${errorMsg}`, 'error')
      onProgress({
        step: 'encode',
        status: 'error',
        message: errorMsg,
      })
      throw err
    }
  }

  /**
   * Process complete HDR conversion pipeline with metadata extraction
   * Uses fresh WASM instances and browser memory for data transfer
   */
  async function processHdrImage(
    _wasmModule: WasmModule,
    file: File,
    fileData: Uint8Array,
    onProgress: (step: ProcessingStep) => void,
  ): Promise<HdrProcessResult> {
    const startTime = performance.now()
    logsStore.add(`\n=== HDR Processing Started: ${file.name} ===`, 'info')
    console.log('[HDR] Starting processing for:', file.name, 'size:', file.size)

    try {
      // Get image dimensions
      const { width, height } = await getImageDimensions(file)
      logsStore.add(`Image dimensions: ${width}x${height}`, 'info')

      // Create unique filenames
      const timestamp = Date.now()
      const inputJpgPath = `/input_${timestamp}.jpg`
      const rawPath = `/temp_${timestamp}.raw`
      const outputPath = `/output_${timestamp}.jpg`
      const metadataPath = `/metadata_${timestamp}.cfg`

      // Step 1: Decode with fresh WASM instance and extract metadata
      // Returns RAW data and metadata stored in browser memory
      console.log('[HDR] Step 1/2: Decoding and extracting metadata...')
      const { rawData, metadata } = await decodeHdrToRaw(fileData, inputJpgPath, rawPath, metadataPath, onProgress)
      console.log('[HDR] RAW data saved in browser:', rawData.length, 'bytes')
      if (metadata) {
        console.log('[HDR] Metadata extracted:', metadata)
      }

      // Step 2: Encode with fresh WASM instance using extracted metadata
      // Uses RAW data and metadata from browser memory
      console.log('[HDR] Step 2/2: Encoding with metadata...')
      const processedData = await encodeRawToHdr(rawData, rawPath, outputPath, width, height, metadata, metadataPath, onProgress)
      console.log('[HDR] Processed data in browser:', processedData.length, 'bytes')

      // Step 3: Extract metadata from processed image to verify preservation
      console.log('[HDR] Step 3/3: Verifying metadata in processed image...')
      const processedJpgPath = `/processed_verify_${timestamp}.jpg`
      const processedRawPath = `/processed_verify_${timestamp}.raw`
      const processedMetadataPath = `/processed_metadata_${timestamp}.cfg`

      const metadataProcessed = await extractMetadataFromProcessed(
        processedData,
        processedJpgPath,
        processedRawPath,
        processedMetadataPath,
      )

      // Log metadata comparison
      if (metadata && metadataProcessed) {
        const isIdentical = JSON.stringify(metadata) === JSON.stringify(metadataProcessed)
        if (isIdentical) {
          logsStore.add('✓ Metadata Verification: All values preserved correctly!', 'success')
        }
        else {
          logsStore.add('⚠ Metadata Verification: Values differ between original and processed', 'warning')
        }
      }
      else if (metadata && !metadataProcessed) {
        logsStore.add('⚠ Metadata Verification: Original metadata exists but processed metadata missing', 'warning')
      }
      else if (!metadata && metadataProcessed) {
        logsStore.add('ℹ Metadata Verification: No original metadata, but processed image has metadata', 'info')
      }
      else {
        logsStore.add('ℹ Metadata Verification: No metadata available for comparison', 'info')
      }

      // Create data URLs for comparison
      const beforeBlob = new Blob([fileData as BlobPart], { type: file.type })
      const afterBlob = new Blob([processedData as BlobPart], { type: 'image/jpeg' })

      const beforeImage = URL.createObjectURL(beforeBlob)
      const afterImage = URL.createObjectURL(afterBlob)

      // No FS cleanup needed - each step uses fresh WASM instance
      logsStore.add('Using fresh WASM instances - no cleanup needed', 'info')

      const duration = ((performance.now() - startTime) / 1000).toFixed(2)
      logsStore.add(`=== HDR Processing Complete: ${file.name} (${duration}s) ===\n`, 'success')

      return {
        success: true,
        beforeImage,
        afterImage,
        originalSize: fileData.length,
        processedSize: processedData.length,
        width,
        height,
        metadataOriginal: metadata || undefined,
        metadataProcessed: metadataProcessed || undefined,
      }
    }
    catch (error: any) {
      const errorMsg = error?.message || String(error)
      logsStore.add(`=== HDR Processing Failed: ${file.name} - ${errorMsg} ===\n`, 'error')

      return {
        success: false,
        beforeImage: '',
        afterImage: '',
        originalSize: file.size,
        processedSize: 0,
        width: 0,
        height: 0,
        error: errorMsg,
      }
    }
  }

  return {
    processHdrImage,
  }
}
