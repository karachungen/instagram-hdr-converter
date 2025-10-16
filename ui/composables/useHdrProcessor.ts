/**
 * HDR Image Processing Service
 * Handles two-step HDR conversion process with metadata extraction
 */

import type { HdrMetadata, HdrProcessResult, WasmModule } from '~/types'

export interface ProcessingStep {
  step: 'decode' | 'encode'
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  message: string
  progress?: number
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
   * Create blob URL from RGBA8888 data for display
   */
  function createBlobUrlFromRGBA(rgba: Uint8Array, width: number, height: number): string {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // Create ImageData from RGBA array
    const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height)
    ctx.putImageData(imageData, 0, 0)

    // Convert canvas to blob URL
    return canvas.toDataURL('image/png')
  }

  /**
   * Extract SDR base image from UltraHDR JPEG using browser's JPEG decoder
   * The browser automatically decodes the base (SDR) image, ignoring gain map
   * Returns RGBA8888 format (4 bytes per pixel) for ultrahdr_app encoding
   */
  async function extractSdrFromJpeg(
    file: File,
    width: number,
    height: number,
  ): Promise<Uint8Array | null> {
    try {
      logsStore.add('[SDR Extract] Using browser to decode base image...', 'info')

      return await new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
          try {
            // Create canvas to extract pixel data
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')

            if (!ctx) {
              URL.revokeObjectURL(url)
              reject(new Error('Failed to get canvas context'))
              return
            }

            // Draw image (browser decodes SDR base image)
            ctx.drawImage(img, 0, 0, width, height)

            // Get RGBA pixel data
            const imageData = ctx.getImageData(0, 0, width, height)
            const rgba = imageData.data

            console.log(`[SDR Extract] Canvas size: ${width}x${height}`)
            console.log(`[SDR Extract] RGBA8888 data size: ${rgba.length} bytes (${width * height * 4})`)

            // Convert Uint8ClampedArray to Uint8Array for WASM
            const rgba8888 = new Uint8Array(rgba)

            URL.revokeObjectURL(url)
            logsStore.add(`[SDR Extract] ✓ Extracted RGBA8888: ${rgba8888.length} bytes (${width}x${height})`, 'success')
            resolve(rgba8888)
          }
          catch (error) {
            URL.revokeObjectURL(url)
            reject(error)
          }
        }

        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to load image for SDR extraction'))
        }

        img.src = url
      })
    }
    catch (error) {
      logsStore.add(`[SDR Extract] Failed: ${error}`, 'error')
      return null
    }
  }

  /**
   * Step 1: Decode HDR to RAW (with fresh WASM module) and extract metadata
   *
   * UltraHDR JPEG contains:
   * - Base image (SDR, 8-bit YUV420)
   * - Gain map (HDR enhancement data)
   *
   * Mode 1 decoding outputs the reconstructed HDR image (P010 format)
   * We need to extract BOTH SDR and HDR for proper re-encoding
   *
   * Commands:
   * 1. ultrahdr_app -m 1 -j image.jpg -z hdr.raw -f metadata.cfg  (get HDR + metadata)
   * 2. Need to decode base SDR separately
   */
  async function decodeHdrToRaw(
    inputData: Uint8Array,
    inputPath: string,
    outputPath: string,
    metadataPath: string,
    onProgress: (step: ProcessingStep) => void,
  ): Promise<{ rawData: Uint8Array, sdrData: Uint8Array | null, metadata: HdrMetadata | null }> {
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

      // Decode HDR (P010) with metadata extraction
      const hdrPath = outputPath.replace('.raw', '_hdr.raw')

      const decodeArgs = ['-m', '1', '-j', inputPath, '-z', hdrPath, '-f', metadataPath]
      logsStore.add(`[HDR Decode] Step 1/2: Extracting HDR (P010) data...`, 'info')
      logsStore.add(`[HDR Decode] Calling: ultrahdr_app ${decodeArgs.join(' ')}`, 'info')
      console.log('[WASM CMD] Decode HDR:', decodeArgs)

      if (freshModule.callMain) {
        const result = freshModule.callMain(decodeArgs)
        console.log('[WASM RESULT] Decode HDR returned:', result)
        logsStore.add(`[HDR Decode] HDR decode returned: ${result}`, 'info')
      }

      // Read HDR RAW output from FS
      const rawData = freshModule.FS.readFile(hdrPath)
      console.log('[FS] Read HDR RAW from FS, size:', rawData.length)
      logsStore.add(`[HDR Decode] ✓ HDR data extracted: ${rawData.length} bytes`, 'success')

      // Extract SDR base image using browser's JPEG decoder
      // UltraHDR JPEG contains base SDR image that browsers decode automatically
      // Mode 2 doesn't exist in ultrahdr_app - we use browser instead!
      let sdrData: Uint8Array | null = null
      try {
        logsStore.add(`[HDR Decode] Step 2/2: Extracting SDR base image via browser...`, 'info')

        // Get dimensions from the original file
        const tempFile = new File([inputData as BlobPart], 'temp.jpg', { type: 'image/jpeg' })
        const { width, height } = await getImageDimensions(tempFile)

        // Extract and convert SDR to YUV420
        sdrData = await extractSdrFromJpeg(tempFile, width, height)

        if (sdrData) {
          console.log('[Browser] SDR extracted and converted to YUV420, size:', sdrData.length)
        }
      }
      catch (error) {
        logsStore.add(`[HDR Decode] ⚠ Could not extract SDR via browser: ${error}`, 'warning')
        console.log('[HDR Decode] SDR extraction failed:', error)
      }

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

      return { rawData, sdrData, metadata }
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
   *
   * SOLUTION: Use BOTH HDR and SDR data for proper re-encoding
   *
   * Mode 0 with both inputs:
   * -p : P010 HDR raw (10-bit)
   * -y : RGBA8888 SDR raw (8-bit, 4 bytes per pixel)
   * -f : Metadata config (gain map parameters)
   *
   * This way the library will use our metadata to generate the gain map correctly!
   *
   * Command: ultrahdr_app -m 0 -p hdr.raw -y sdr.raw -w 1080 -h 1080 -z output.jpg -f metadata.cfg
   */
  async function encodeRawToHdr(
    rawData: Uint8Array,
    sdrData: Uint8Array | null,
    inputPath: string,
    sdrPath: string,
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

      // Write HDR RAW file from browser memory to fresh FS
      freshModule.FS.writeFile(inputPath, rawData)
      console.log('[FS] Wrote HDR RAW file to fresh FS:', inputPath, 'size:', rawData.length)
      console.log('[Encode] Dimensions for encoding: width=', width, 'height=', height)
      logsStore.add(`[HDR Encode] HDR file restored: ${rawData.length} bytes`, 'info')

      // Calculate expected sizes for debugging
      const expectedP010Size = width * height * 2 // P010 is 2 bytes per pixel (10-bit)
      const expectedRGBA8888Size = width * height * 4 // RGBA8888 is 4 bytes per pixel
      console.log(`[Encode] Expected HDR (P010) size: ${expectedP010Size} bytes`)
      console.log(`[Encode] Expected SDR (RGBA8888) size: ${expectedRGBA8888Size} bytes`)

      // Write SDR RAW file if available
      if (sdrData) {
        freshModule.FS.writeFile(sdrPath, sdrData)
        console.log('[FS] Wrote SDR RAW file to fresh FS:', sdrPath, 'size:', sdrData.length)
        logsStore.add(`[HDR Encode] SDR file written: ${sdrData.length} bytes (RGBA8888 format)`, 'info')

        // Calculate expected RGBA8888 size
        const expectedSize = width * height * 4
        const sizeMatch = sdrData.length === expectedSize
        logsStore.add(`[HDR Encode] SDR size check: ${sizeMatch ? '✓ correct' : '⚠ mismatch'} (expected: ${expectedSize}, got: ${sdrData.length})`, sizeMatch ? 'success' : 'warning')

        if (!sizeMatch) {
          logsStore.add(`[HDR Encode] ⚠ WARNING: Size mismatch may cause encoding failure!`, 'error')
          console.error('[Encode] SDR size mismatch! This will likely cause WASM error')
        }
      }
      else {
        logsStore.add('[HDR Encode] ⚠ No SDR data available - will use fallback mode', 'warning')
      }

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

      // Build encode command with both HDR and SDR if available
      const encodeArgs = ['-m', '0']

      // If we have both HDR and SDR data, use them both for accurate re-encoding
      if (sdrData) {
        logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
        logsStore.add('✓ OPTIMAL MODE: Using BOTH HDR and SDR inputs', 'success')
        logsStore.add(`  • HDR input (-p): ${inputPath} [P010 10-bit]`, 'info')
        logsStore.add(`  • SDR input (-y): ${sdrPath} [RGBA8888 8-bit]`, 'info')
        logsStore.add(`  • Dimensions: ${width}x${height}`, 'info')
        logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
        encodeArgs.push('-p', inputPath) // HDR (P010)
        encodeArgs.push('-y', sdrPath) // SDR (RGBA8888)
      }
      else {
        logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'warning')
        logsStore.add('⚠ FALLBACK MODE: Using only HDR as base image', 'warning')
        logsStore.add('  Metadata may not be preserved correctly!', 'warning')
        logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'warning')
        encodeArgs.push('-y', inputPath) // Only one input
      }

      // Add dimensions and output
      encodeArgs.push('-w', String(width))
      encodeArgs.push('-h', String(height))
      encodeArgs.push('-z', outputPath)

      // Add metadata flag if available
      if (metadata) {
        encodeArgs.push('-f', metadataPath)
        if (sdrData) {
          logsStore.add('✓ Metadata configuration attached - will preserve original gain map parameters!', 'success')
          logsStore.add(`  • maxContentBoost: ${Array.isArray(metadata.maxContentBoost) ? metadata.maxContentBoost.join(', ') : metadata.maxContentBoost}`, 'info')
          logsStore.add(`  • minContentBoost: ${Array.isArray(metadata.minContentBoost) ? metadata.minContentBoost.join(', ') : metadata.minContentBoost}`, 'info')
          logsStore.add(`  • gamma: ${Array.isArray(metadata.gamma) ? metadata.gamma.join(', ') : metadata.gamma}`, 'info')
        }
        else {
          logsStore.add('⚠ Metadata file attached but may be ignored in fallback mode', 'warning')
        }
      }
      else {
        logsStore.add('ℹ No metadata available - library will use default gain map values', 'info')
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
      logsStore.add(`[HDR Encode] ✓ Output generated: ${outputData.length} bytes`, 'success')

      // Summary
      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')
      logsStore.add('✓ ENCODING COMPLETE', 'success')
      if (sdrData) {
        logsStore.add('  Mode: OPTIMAL (HDR + SDR + Metadata)', 'success')
        logsStore.add('  Result: Metadata should be preserved!', 'success')
      }
      else {
        logsStore.add('  Mode: FALLBACK (HDR only)', 'warning')
        logsStore.add('  Result: Default metadata used', 'warning')
      }
      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')

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
      // Returns HDR RAW, SDR RAW (if available), and metadata stored in browser memory
      console.log('[HDR] Step 1/3: Decoding and extracting metadata...')
      const { rawData, sdrData, metadata } = await decodeHdrToRaw(fileData, inputJpgPath, rawPath, metadataPath, onProgress)
      console.log('[HDR] HDR data saved in browser:', rawData.length, 'bytes')
      if (sdrData) {
        console.log('[HDR] SDR data saved in browser:', sdrData.length, 'bytes')
      }
      if (metadata) {
        console.log('[HDR] Metadata extracted:', metadata)
      }

      // Step 2: Encode with fresh WASM instance using extracted metadata
      // Uses HDR RAW, SDR RAW, and metadata from browser memory
      console.log('[HDR] Step 2/3: Encoding with metadata...')
      const hdrPath = rawPath.replace('.raw', '_hdr.raw')
      const sdrPath = rawPath.replace('.raw', '_sdr.raw')
      const processedData = await encodeRawToHdr(rawData, sdrData, hdrPath, sdrPath, outputPath, width, height, metadata, metadataPath, onProgress)
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
      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
      logsStore.add('METADATA VERIFICATION', 'info')
      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')

      if (metadata && metadataProcessed) {
        const isIdentical = JSON.stringify(metadata) === JSON.stringify(metadataProcessed)
        if (isIdentical) {
          logsStore.add('✓✓✓ SUCCESS! All metadata values preserved correctly!', 'success')
          logsStore.add('  Original and processed metadata are identical', 'success')
        }
        else {
          logsStore.add('⚠ Values differ between original and processed', 'warning')

          // Check which fields differ
          const fields: (keyof HdrMetadata)[] = ['maxContentBoost', 'minContentBoost', 'gamma', 'offsetSdr', 'offsetHdr', 'hdrCapacityMin', 'hdrCapacityMax', 'useBaseColorSpace']
          fields.forEach((field) => {
            const origStr = JSON.stringify(metadata[field])
            const procStr = JSON.stringify(metadataProcessed[field])
            if (origStr !== procStr) {
              logsStore.add(`  • ${field}: ${origStr} → ${procStr}`, 'warning')
            }
          })
        }

        if (sdrData) {
          logsStore.add('✓ Used OPTIMAL mode (HDR + SDR + Metadata)', 'info')
        }
        else {
          logsStore.add('⚠ Used FALLBACK mode (HDR only) - this may explain differences', 'warning')
        }
      }
      else if (metadata && !metadataProcessed) {
        logsStore.add('⚠ Original metadata exists but processed metadata missing', 'warning')
      }
      else if (!metadata && metadataProcessed) {
        logsStore.add('ℹ No original metadata, but processed image has metadata', 'info')
      }
      else {
        logsStore.add('ℹ No metadata available for comparison', 'info')
      }

      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')

      // Create HDR data URLs for comparison
      const beforeBlob = new Blob([fileData as BlobPart], { type: file.type })
      const afterBlob = new Blob([processedData as BlobPart], { type: 'image/jpeg' })

      const beforeImage = URL.createObjectURL(beforeBlob)
      const afterImage = URL.createObjectURL(afterBlob)

      // Create SDR data URLs for comparison
      logsStore.add('[SDR URLs] Creating SDR preview images...', 'info')
      let beforeImageSdr = ''
      let afterImageSdr = ''

      if (sdrData) {
        // We already have original SDR from decoding
        try {
          beforeImageSdr = createBlobUrlFromRGBA(sdrData, width, height)
          logsStore.add('[SDR URLs] ✓ Original SDR preview created', 'success')
        }
        catch (error) {
          logsStore.add(`[SDR URLs] ⚠ Failed to create original SDR preview: ${error}`, 'warning')
        }
      }

      // Extract SDR from processed image
      try {
        const processedFile = new File([processedData as BlobPart], 'processed.jpg', { type: 'image/jpeg' })
        const processedSdrData = await extractSdrFromJpeg(processedFile, width, height)
        if (processedSdrData) {
          afterImageSdr = createBlobUrlFromRGBA(processedSdrData, width, height)
          logsStore.add('[SDR URLs] ✓ Processed SDR preview created', 'success')
        }
      }
      catch (error) {
        logsStore.add(`[SDR URLs] ⚠ Failed to create processed SDR preview: ${error}`, 'warning')
      }

      // No FS cleanup needed - each step uses fresh WASM instance
      logsStore.add('Using fresh WASM instances - no cleanup needed', 'info')

      const duration = ((performance.now() - startTime) / 1000).toFixed(2)
      const sizeChangeNum = (processedData.length - fileData.length) / fileData.length * 100
      const sizeChange = sizeChangeNum.toFixed(1)

      logsStore.add('', 'info')
      logsStore.add('═══════════════════════════════════════════', 'success')
      logsStore.add('✓ HDR PROCESSING COMPLETE!', 'success')
      logsStore.add('═══════════════════════════════════════════', 'success')
      logsStore.add(`File: ${file.name}`, 'info')
      logsStore.add(`Duration: ${duration}s`, 'info')
      logsStore.add(`Original: ${(fileData.length / 1024).toFixed(2)} KB`, 'info')
      logsStore.add(`Processed: ${(processedData.length / 1024).toFixed(2)} KB (${sizeChangeNum > 0 ? '+' : ''}${sizeChange}%)`, 'info')
      logsStore.add(`Resolution: ${width}x${height}`, 'info')
      if (sdrData) {
        logsStore.add('Mode: ✓ OPTIMAL (HDR + SDR + Metadata)', 'success')
      }
      else {
        logsStore.add('Mode: ⚠ FALLBACK (HDR only)', 'warning')
      }
      logsStore.add('═══════════════════════════════════════════', 'success')
      logsStore.add('', 'info')

      return {
        success: true,
        beforeImage,
        afterImage,
        beforeImageSdr,
        afterImageSdr,
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
        beforeImageSdr: '',
        afterImageSdr: '',
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
